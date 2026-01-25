// .eslintrc.cjs
/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "react-hooks/set-state-in-effect": "off",
  },
  overrides: [
    {
      files: ["app/api/**/*.{ts,tsx}", "app/**/*.route.{ts,tsx}"],
      rules: {
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
  ],
};
