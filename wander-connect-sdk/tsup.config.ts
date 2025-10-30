import type { Options } from "tsup";

const env = process.env.NODE_ENV;

const common: Options = {
  splitting: false,
  clean: true, // clean up the dist folder
  bundle: true,
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  watch: env === "development",
  target: "es2020",
  outDir: "sdk-dist",
  entry: ["src/index.ts", "!src/**/__tests__/**", "!src/**/*.test.*"], //include all files under src
  shims: true,
  treeshake: true,
  esbuildOptions: (options) => {
    options.alias = {
      "wallet-api": "./wallet-api-dist",
    };
  },
};

const cjsEsmOptions: Options = {
  dts: true, // generate dts files
  format: ["cjs", "esm"], // generate cjs and esm files
  minify: env === "production",
  sourcemap: true,
  ...common,
};

const iifeOptions: Options = {
  dts: false,
  format: ["iife"],
  minify: true,
  sourcemap: false,
  ...common,
};

export default [cjsEsmOptions, iifeOptions];
