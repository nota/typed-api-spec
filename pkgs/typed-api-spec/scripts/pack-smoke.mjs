import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
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

const cacheDir = mkdtempSync(join(tmpdir(), "tas-npm-cache-"));
const cleanupDirs = [cacheDir];

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
  run(`npm install ${omitFlag} ${peers} "${tarball}"`.trim(), dir);
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
} finally {
  for (const dir of cleanupDirs) rmSync(dir, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(failures.join("\n\n"));
  process.exit(1);
}

console.log("pack smoke: OK");
