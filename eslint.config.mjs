import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage/**",
  ]),
  {
    // Output encoding stays React's (OWASP ASVS 1.2, 1.3): no raw HTML
    // inserted into the page and no javascript: URL, both errors, so a new
    // one fails the build instead of waiting for a review to notice it. BCM
    // never accepts HTML from its users; anything that would have to be
    // sanitized first (DOMPurify) and listed here with its reason.
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/no-danger": "error",
      "react/jsx-no-script-url": "error",
    },
  },
  {
    rules: {
      // Allow variables prefixed with _ to be intentionally unused
      // (common pattern in destructuring: const { skip: _, ...rest } = obj)
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
