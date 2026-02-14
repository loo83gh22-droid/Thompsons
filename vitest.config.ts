import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "tests/**",
        "**/*.config.*",
        "**/types.ts",
        "app/**/layout.tsx",
        "app/**/loading.tsx",
        "app/**/error.tsx",
      ],
      include: [
        "src/lib/**/*.ts",
        "app/**/actions.ts",
        "app/api/**/*.ts",
        "app/components/**/*.tsx",
      ],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
