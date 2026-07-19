import { fileURLToPath, URL } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@mui/material",
      "@emotion/react",
      "@emotion/styled",
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    alias: [
      {
        find: /^sigma$/,
        replacement: fileURLToPath(
          new URL("./src/test/mocks/sigma.ts", import.meta.url),
        ),
      },
    ],
    setupFiles: ["./src/test/setup.ts"],
  },
});
