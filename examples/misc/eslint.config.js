const js = require("@eslint/js");
const tseslint = require("typescript-eslint");

module.exports = tseslint.config(
  { ignores: ["eslint.config.js", "**/dist/*"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
