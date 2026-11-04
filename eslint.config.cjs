const { FlatCompat } = require("@eslint/eslintrc");
const eslintJs = require("@eslint/js");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: eslintJs.configs.recommended,
});

module.exports = [
  {
    ignores: ["build/**", "node_modules/**", ".react-router/**", ".npm-cache-deps/**"],
  },
  ...compat.config(require("./.eslintrc.cjs")),
  {
    files: ["**/*.cjs", "print-agent.js"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        process: "readonly",
      },
    },
  },
];
