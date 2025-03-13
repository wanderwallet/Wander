import { defineConfig } from "vite";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
import dts from "vite-plugin-dts";
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      tsconfigPath: "./tsconfig.json"
    }),
    nodePolyfills()
  ],
  build: {
    lib: {
      entry: path.resolve(
        __dirname,
        "src/api/foreground/foreground-setup-wallet-sdk.ts"
      ),
      name: "WalletSDK",
      formats: ["es", "umd"],
      fileName: (format) => `wallet-sdk.${format}.js`
    },
    outDir: "wander-embedded-sdk/wallet-api-dist",
    sourcemap: true,
    rollupOptions: {
      external: [
        "webextension-polyfill",
        "~subscriptions/subscription",
        "~iframe/plasmo-storage/plasmo-storage.mock"
      ],
      output: {
        globals: {
          "webextension-polyfill": "browser",
          "~subscriptions/subscription": "ArConnectSubscription",
          "~iframe/plasmo-storage/plasmo-storage.mock": "PlasmoStorageMock"
        }
      },
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    }
  },
  define: {
    "process.env": {
      ...(process?.env || {})
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "~api": path.resolve(__dirname, "./src/api"),
      "~lib": path.resolve(__dirname, "./src/lib"),
      "~utils": path.resolve(__dirname, "./src/utils"),
      "~gateways": path.resolve(__dirname, "./src/gateways"),
      "~wallets": path.resolve(__dirname, "./src/wallets"),
      "~applications": path.resolve(__dirname, "./src/applications"),
      "~subscriptions": path.resolve(__dirname, "./src/subscriptions"),
      "~iframe": path.resolve(__dirname, "./src/iframe"),
      // Polyfill `webextension-polyfill` for embedded, as that's not a BE but a regular SPA:
      "webextension-polyfill": path.resolve(__dirname, "./src/iframe/browser")
    }
  }
});
