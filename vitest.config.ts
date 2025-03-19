import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 10000
  },
  resolve: {
    alias: {
      "~utils": resolve(__dirname, "./src/utils"),
      "~iframe": resolve(__dirname, "./src/iframe")
    }
  }
});
