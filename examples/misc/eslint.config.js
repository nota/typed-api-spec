const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = tseslint.config(
  { ignores: ["eslint.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
);
