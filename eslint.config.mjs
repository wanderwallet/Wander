import nx from "@nx/eslint-plugin";

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/javascript"],
  {
    ignores: ["**/dist", "**/vite.config.*.timestamp*", "**/vitest.config.*.timestamp*", "**/test-output"],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          allow: ["^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$"],
          depConstraints: [
            {
              sourceTag: "*",
              onlyDependOnLibsWithTags: ["*"],
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts", "**/*.js", "**/*.jsx", "**/*.cjs", "**/*.mjs"],
    // Override or add rules here
    rules: {
      "@typescript-eslint/ban-ts-comment": 0,
      "@typescript-eslint/no-empty-function": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-unused-vars": 0,
      "no-async-promise-executor": 0,
      "no-empty": 0,
      "no-loss-of-precision": 0,
      "no-prototype-builtins": 0,
      "no-restricted-globals": 0,
      "no-unsafe-optional-chaining": 0,
      "no-useless-escape": 0,
      "react-hooks/exhaustive-deps": 0,
      "react/jsx-no-undef": 0,
    },
  },
];
