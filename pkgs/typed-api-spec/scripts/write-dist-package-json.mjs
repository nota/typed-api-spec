import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Nodeとtscは.jsと.d.tsがCJSかESMかを最も近いpackage.jsonの"type"で判定する
const TYPE_BY_DIR = { "dist/cjs": "commonjs", "dist/esm": "module" };

for (const [dir, type] of Object.entries(TYPE_BY_DIR)) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "package.json"), `${JSON.stringify({ type })}\n`);
}
