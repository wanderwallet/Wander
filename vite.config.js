import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import nodePolyfills from "vite-plugin-node-stdlib-browser";

// https://vite.dev/config/
export default defineConfig({
  // root: "./src/iframe/index.html",
  plugins: [react(), nodePolyfills()],
  define: {
    "process.env": {
      ...(process?.env || {})
    }
  },
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
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
