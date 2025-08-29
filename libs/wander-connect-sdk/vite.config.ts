/// <reference types='vitest' />
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import * as path from "path";

// OLD tsup.config.ts:
//
// import type { Options } from "tsup";
//
// const env = process.env.NODE_ENV;
//
// export const tsup: Options = {
//   splitting: false,
//   clean: true, // clean up the dist folder
//   dts: true, // generate dts files
//   format: ["cjs", "esm", "iife"], // generate cjs, iife and esm files
//   minify: env === "production",
//   bundle: true,
//   skipNodeModulesBundle: true,
//   entryPoints: ["src/index.ts"],
//   watch: env === "development",
//   target: "es2020",
//   outDir: "sdk-dist",
//   entry: ["src/**/*.ts", "!src/**/__tests__/**", "!src/**/*.test.*"], //include all files under src
//   shims: true,
//   sourcemap: true,
//   treeshake: true,
//   esbuildOptions: (options) => {
//     options.alias = {
//       "wallet-api": "./wallet-api-dist",
//     };
//   },
// };

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/libs/wander-connect-sdk",
  plugins: [dts({ entryRoot: "src", tsconfigPath: path.join(__dirname, "tsconfig.lib.json") })],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  // Configuration for building your library.
  // See: https://vitejs.dev/guide/build.html#library-mode
  build: {
    target: "es2020",
    sourcemap: true,
    outDir: "./dist",
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      // Could also be a dictionary or array of multiple entry points.
      entry: "src/index.ts",
      name: "wander-connect-sdk",
      fileName: "index",
      // TODO: Update to support the same formats as before: ["cjs", "esm", "iife"]
      // Change this to the formats you want to support.
      // Don't forget to update your package.json as well.
      formats: ["es" as const],
    },
    rollupOptions: {
      // External packages that should not be bundled into your library.
      external: [],
    },
  },
  test: {
    name: "wander-connect-sdk",
    watch: false,
    globals: true,
    environment: "node",
    include: ["{src,tests}/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    reporters: ["default"],
    coverage: {
      reportsDirectory: "./test-output/vitest/coverage",
      provider: "v8" as const,
    },
  },
}));
