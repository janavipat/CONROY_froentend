import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  /**
   * Every image goes through SafeImage.
   *
   * next/image renders a broken image when the optimizer refuses a variant,
   * which is what happened when the Vercel transformation quota ran out —
   * product photography and the homepage hero went blank while the source
   * files were perfectly healthy. SafeImage requests through the optimizer
   * exactly the same way and only falls back to the original URL if that
   * request fails.
   *
   * This rule is the part that keeps it true. Without it the protection lasts
   * only until someone adds a component with the obvious import, and the next
   * quota exhaustion takes those images down silently.
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/SafeImage.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "next/image",
              message:
                "Import { SafeImage } from '@/components/ui/SafeImage' instead. It optimises exactly like next/image but falls back to the original source if the optimizer fails, so a spent quota cannot blank out product images.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
