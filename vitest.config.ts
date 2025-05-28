// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    testTimeout: 10000,
  },
  resolve: {
    alias: {
      "url:/assets": path.resolve(__dirname, "./assets"),
      "~utils": path.resolve(__dirname, "./src/utils"),
      "~gateways": path.resolve(__dirname, "./src/gateways"),
      "~iframe": path.resolve(__dirname, "./src/iframe"),
      "webextension-polyfill": path.resolve(__dirname, "./src/iframe/browser"),
      "embed-api": path.resolve(__dirname, "node_modules/embed-api/dist/index.mjs"),
    },
  },
});
