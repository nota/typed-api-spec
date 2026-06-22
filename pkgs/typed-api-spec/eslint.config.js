const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const strictDependencies = require("eslint-plugin-strict-dependencies");

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

module.exports = tseslint.config(
  { ignores: ["**/dist/*", "docs/**/*", "eslint.config.js"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "strict-dependencies": strictDependencies,
    },
    rules: {
      "strict-dependencies/strict-dependencies": [
        "error",
        depRules,
        { resolveRelativeImport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrors: "none",
        },
      ],
    },
  },
  {
    files: ["**/*.t-test.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
);
