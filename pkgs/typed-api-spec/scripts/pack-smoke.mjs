import { execSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

function makeFixture(tarball, extraPeers, { omitOptional }) {
  const dir = mkdtempSync(join(tmpdir(), "tas-fixture-"));
  cleanupDirs.push(dir);
  run("npm init -y", dir);
  const omitFlag = omitOptional ? "--omit=optional" : "";
  const peers = extraPeers.join(" ");
  run(
    `npm install --no-audit --no-fund ${omitFlag} ${peers} "${tarball}"`.trim(),
    dir,
  );
  return dir;
}

function checkSubpath(dir, subpath, failures) {
  const spec =
    subpath === "."
      ? "@notainc/typed-api-spec"
      : `@notainc/typed-api-spec/${subpath}`;
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

try {
  const tarball = packTarball();

  for (const { peers, subpaths } of groupByPeers(REQUIRED_PEERS)) {
    const dir = makeFixture(tarball, peers, { omitOptional: true });
    for (const subpath of subpaths) checkSubpath(dir, subpath, failures);
  }

  const fullDir = makeFixture(tarball, ALL_OPTIONAL_PEERS, {
    omitOptional: false,
  });
  for (const subpath of Object.keys(REQUIRED_PEERS)) {
    checkSubpath(fullDir, subpath, failures);
  }
  checkOpenApi(fullDir, failures);
} finally {
  for (const dir of cleanupDirs) rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log("pack smoke: OK");
