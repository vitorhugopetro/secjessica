import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
    globals: true,
  },
});
