import { execSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REQUIRED_PEERS = {
  ".": [],
  core: [],
  fetch: [],
  json: [],
  express: ["express"],
  fastify: [],
  msw: ["msw"],
};

const ALL_OPTIONAL_PEERS = [
  "express",
  "fastify",
  "fastify-type-provider-zod",
  "msw",
  "valibot",
  "zod",
  "@valibot/to-json-schema",
];

const { peerDependencies } = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

const cacheDir = join(tmpdir(), "tas-pack-smoke-npm-cache");
mkdirSync(cacheDir, { recursive: true });
const cleanupDirs = [];

function run(cmd, cwd) {
  return execSync(cmd, {
    cwd,
    stdio: "pipe",
    encoding: "utf8",
    env: { ...process.env, npm_config_cache: cacheDir },
  });
}

function packTarball() {
  const packDir = mkdtempSync(join(tmpdir(), "tas-pack-"));
  cleanupDirs.push(packDir);
  const json = run(
    `npm pack --json --pack-destination "${packDir}"`,
    process.cwd(),
  );
  return join(packDir, JSON.parse(json)[0].filename);
}

function peerSpec(name) {
  const range = peerDependencies[name];
  if (range === undefined) {
    throw new Error(`${name} is not in peerDependencies`);
  }
  return `"${name}@${range}"`;
}

function makeFixture(tarball, extraPeers, { minimal }) {
  const dir = mkdtempSync(join(tmpdir(), "tas-fixture-"));
  cleanupDirs.push(dir);
  run("npm init -y", dir);
  // npmは必須のpeerとoptionalDependenciesを自動で入れるので、止めないと依存漏れを検出できない
  const minimalFlags = minimal ? "--legacy-peer-deps --omit=optional" : "";
  const peers = extraPeers.map(peerSpec).join(" ");
  run(
    `npm install --no-audit --no-fund ${minimalFlags} ${peers} "${tarball}"`,
    dir,
  );
  return dir;
}

function specifier(subpath) {
  return subpath === "."
    ? "@notainc/typed-api-spec"
    : `@notainc/typed-api-spec/${subpath}`;
}

function checkSubpath(dir, subpath, failures) {
  const spec = specifier(subpath);
  writeFileSync(join(dir, "c.cjs"), `require(${JSON.stringify(spec)})`);
  writeFileSync(join(dir, "e.mjs"), `await import(${JSON.stringify(spec)})`);
  for (const file of ["c.cjs", "e.mjs"]) {
    try {
      run(`node ${file}`, dir);
    } catch (e) {
      failures.push(`[${subpath}] ${file} failed:\n${e.stdout}\n${e.stderr}`);
    }
  }
}

function typescriptSpec() {
  const version = process.env.PACK_SMOKE_TYPESCRIPT;
  return version ? `"typescript@${version}"` : peerSpec("typescript");
}

const TYPE_CHECK_MODULE_OPTIONS = {
  cjs: "--module nodenext",
  esm: "--module esnext --moduleResolution bundler",
};

function checkTypes(dir, failures) {
  // /expressの.d.tsはexpressの型を、fastifyの型はNode.jsの型を参照する
  const typePackages = [
    peerSpec("@types/express"),
    peerSpec("@types/express-serve-static-core"),
    '"@types/node"',
  ];
  run(
    `npm install --no-audit --no-fund ${typescriptSpec()} ${typePackages.join(" ")}`,
    dir,
  );
  const tsc = `node ${join("node_modules", "typescript", "bin", "tsc")}`;
  const version = run(`${tsc} -v`, dir)
    .trim()
    .replace(/^Version /, "TypeScript ");
  writeFileSync(
    join(dir, "types.ts"),
    Object.keys(REQUIRED_PEERS)
      .map(
        (subpath, i) =>
          `import * as m${i} from ${JSON.stringify(specifier(subpath))};`,
      )
      .join("\n") + "\n",
  );
  for (const [name, moduleOptions] of Object.entries(
    TYPE_CHECK_MODULE_OPTIONS,
  )) {
    try {
      run(
        `${tsc} --noEmit --strict --skipLibCheck false --target es2022 --lib es2022,dom ${moduleOptions} types.ts`,
        dir,
      );
    } catch (e) {
      failures.push(
        `[types] ${name} with ${version} failed:\n${e.stdout}\n${e.stderr}`,
      );
    }
  }
  return version;
}

// zod-openapiと@valibot/to-json-schemaは関数を呼んだ時に初めて動的importされるので、importするだけでは読み込みを検査できない
const OPENAPI_CHECK_BODY = `
  for (const [vendor, body] of [
    ["zod", z.object({ name: z.string() })],
    ["valibot", v.object({ name: v.string() })],
  ]) {
    const doc = await toOpenApiDoc(
      { openapi: "3.1.0", info: { title: "t", version: "1" } },
      { "/x": { get: { responses: { 200: { body } } } } },
    );
    const schema =
      doc.paths["/x"].get.responses["200"].content["application/json"].schema;
    if (schema.properties?.name?.type !== "string") {
      throw new Error(vendor + ": " + JSON.stringify(schema));
    }
  }
`;

function checkOpenApi(dir, failures) {
  writeFileSync(
    join(dir, "openapi.cjs"),
    `const { toOpenApiDoc } = require("@notainc/typed-api-spec");
const z = require("zod");
const v = require("valibot");
(async () => {${OPENAPI_CHECK_BODY}})().catch((e) => {
  console.error(e);
  process.exit(1);
});
`,
  );
  writeFileSync(
    join(dir, "openapi.mjs"),
    `import { toOpenApiDoc } from "@notainc/typed-api-spec";
import * as z from "zod";
import * as v from "valibot";
${OPENAPI_CHECK_BODY}`,
  );
  for (const file of ["openapi.cjs", "openapi.mjs"]) {
    try {
      run(`node ${file}`, dir);
    } catch (e) {
      failures.push(`[toOpenApiDoc] ${file} failed:\n${e.stdout}\n${e.stderr}`);
    }
  }
}

function installedPackageDir(fixtureDir) {
  return join(fixtureDir, "node_modules", "@notainc/typed-api-spec");
}

// checkSubpathはexports経由で読むので、top-levelのフィールドはそこでは検査されない
function checkTopLevelEntries(dir, failures) {
  const pkgDir = installedPackageDir(dir);
  const pkg = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
  for (const field of ["main", "module", "types"]) {
    if (pkg[field] === undefined) {
      failures.push(`[${field}] is not set`);
    } else if (
      !statSync(join(pkgDir, pkg[field]), { throwIfNoEntry: false })?.isFile()
    ) {
      failures.push(`[${field}] ${pkg[field]} is not a file`);
    }
  }
}

// CJSに残ったimport()は、--experimental-vm-modulesを付けずに動かすJestで落ちる
function checkNoDynamicImportInCjs(dir, failures) {
  const cjsDir = join(installedPackageDir(dir), "dist/cjs");
  for (const file of readdirSync(cjsDir, { recursive: true })) {
    if (!file.endsWith(".js")) continue;
    const lines = readFileSync(join(cjsDir, file), "utf8").split("\n");
    lines.forEach((line, i) => {
      if (/\bimport\s*\(/.test(line)) {
        failures.push(
          `[dist/cjs] ${file}:${i + 1} has import():\n${line.trim()}`,
        );
      }
    });
  }
}

function groupByPeers(peerMap) {
  const groups = new Map();
  for (const [subpath, peers] of Object.entries(peerMap)) {
    const key = [...peers].sort().join(",");
    if (!groups.has(key)) groups.set(key, { peers, subpaths: [] });
    groups.get(key).subpaths.push(subpath);
  }
  return [...groups.values()];
}

const failures = [];
let typescriptVersion;

try {
  const tarball = packTarball();

  for (const { peers, subpaths } of groupByPeers(REQUIRED_PEERS)) {
    const dir = makeFixture(tarball, peers, { minimal: true });
    for (const subpath of subpaths) checkSubpath(dir, subpath, failures);
  }

  const fullDir = makeFixture(tarball, ALL_OPTIONAL_PEERS, { minimal: false });
  for (const subpath of Object.keys(REQUIRED_PEERS)) {
    checkSubpath(fullDir, subpath, failures);
  }
  checkOpenApi(fullDir, failures);
  checkTopLevelEntries(fullDir, failures);
  checkNoDynamicImportInCjs(fullDir, failures);
  typescriptVersion = checkTypes(fullDir, failures);
} finally {
  for (const dir of cleanupDirs) rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log(`pack smoke: OK (types checked with ${typescriptVersion})`);
