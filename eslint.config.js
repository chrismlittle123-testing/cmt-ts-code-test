import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "error",
      "no-console": "warn",
      complexity: ["error", { max: 10 }],
    },
  },
  {
    ignores: ["node_modules/**", "dist/**", "fixtures/**"],
  },
];
