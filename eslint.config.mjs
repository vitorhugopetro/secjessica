import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next_build/**",
    ".firebase/**",
    "out/**",
    "build/**",
    ".kilo/**",
    "scripts/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
