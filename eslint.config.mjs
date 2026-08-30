import nextConfig from "eslint-config-next";
import nextTsConfig from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "storage/**",
      "tests/**",
      "scripts/**",
      "next-env.d.ts",
    ],
  },
  ...nextConfig,
  ...nextTsConfig,
  {
    files: ["src/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
    },
  },
];

export default eslintConfig;
