const dRef = ["src/index.ts", "misc/**/*", "**/*.test.ts", "**/*.t-test.ts"];
const depRules = [
  {
    module: "src/express",
    allowReferenceFrom: [...dRef],
    allowSameModule: true,
  },
  {
    module: "src/fastify",
    allowReferenceFrom: [...dRef],
    allowSameModule: false,
  },
  {
    module: "src/fetch",
    allowReferenceFrom: [...dRef, "src/zod"],
    allowSameModule: true,
  },
  {
    module: "src/json",
    allowReferenceFrom: [...dRef, "src/fetch", "src/core"],
    allowSameModule: false,
  },
  {
    module: "src/zod",
    allowReferenceFrom: [
      ...dRef,
      "src/express/zod",
      "src/fastify/zod",
      "**/*.test.ts",
    ],
    allowSameModule: true,
  },
];
module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  overrides: [],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "strict-dependencies"],
  ignorePatterns: ["**/dist/*", "docs/**/*"],
  rules: {
    "strict-dependencies/strict-dependencies": [
      "error",
      depRules,
      { resolveRelativeImport: true },
    ],
  },
};
