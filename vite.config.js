import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";
// import circleDependency from "vite-plugin-circular-dependency";

// https://vite.dev/config/
export default defineConfig({
  // root: "./src/iframe/index.html",
  plugins: [
    react(),
    nodePolyfills()
    // ,circleDependency() // uncomment this to see circular dependencies while building in the console
  ],
  define: {
    "process.env": {
      ...(process?.env || {}),
      "process.env.NODE_ENV": process.env.NODE_ENV || "development"
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
      "~constants": path.resolve(__dirname, "./src/constants"),
      "~api": path.resolve(__dirname, "./src/api"),
      "~applications": path.resolve(__dirname, "./src/applications"),
      "~components": path.resolve(__dirname, "./src/components"),
      "~contacts": path.resolve(__dirname, "./src/contacts"),
      "~gateways": path.resolve(__dirname, "./src/gateways"),
      "~iframe": path.resolve(__dirname, "./src/iframe"),
      "~lib": path.resolve(__dirname, "./src/lib"),
      "~notifications": path.resolve(__dirname, "./src/notifications"),
      "~routes": path.resolve(__dirname, "./src/routes"),
      "~settings": path.resolve(__dirname, "./src/settings"),
      "~subscriptions": path.resolve(__dirname, "./src/subscriptions"),
      "~tokens": path.resolve(__dirname, "./src/tokens"),
      "~utils": path.resolve(__dirname, "./src/utils"),
      "~wallets": path.resolve(__dirname, "./src/wallets"),

      // BE or Embed (iframe) strategies for messaging and chunking:
      "~isomorphic-messaging": path.resolve(
        __dirname,
        "./src/utils/messaging/strategies/iframe/iframe-messaging.strategy.ts"
      ),
      "~isomorphic-chunking": path.resolve(
        __dirname,
        "./src/utils/messaging/strategies/iframe/iframe-chunking.strategy.ts"
      ),
      // Prisma Enum Fix:
      // See https://github.com/prisma/prisma/issues/12504#issuecomment-1136126199
      // See https://github.com/sveltejs/kit/issues/4444
      ".prisma/client/index-browser":
        "./node_modules/.prisma/client/index-browser.js",

      // Assets:
      "assets/lotties": path.resolve(__dirname, "./assets/lotties"),
      "url:/assets": path.resolve(__dirname, "./assets"),
      "url:assets": path.resolve(__dirname, "./assets"),
      "url:/assets-beta": path.resolve(__dirname, "./assets-beta"),
      "url:assets-beta": path.resolve(__dirname, "./assets-beta"),

      // Polyfill `webextension-polyfill` for embedded, as that's not a BE but a regular SPA:
      "webextension-polyfill": path.resolve(__dirname, "./src/iframe/browser")
    }
  }
});
