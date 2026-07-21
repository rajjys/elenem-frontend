import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // All backend calls must go through the shared `api` client (auth + token
    // refresh). Use `isAxiosError` from @/services/api for error type-guards.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message:
                "Import { api, isAxiosError } from '@/services/api' instead — it adds auth headers and token refresh. Raw axios is only for direct-to-storage uploads (S3 presigned PUT), which must carry an eslint-disable with a reason.",
            },
          ],
        },
      ],
    },
  },
  {
    // The shared client is the one place allowed to import axios directly.
    files: ["services/api.ts"],
    rules: { "no-restricted-imports": "off" },
  },
];

export default eslintConfig;
