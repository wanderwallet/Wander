import type { ModuleFunction } from "~api/module";

/**
 * Foreground functionality of the module
 */
const foreground: ModuleFunction<string> = async (test: string) => {
  console.log("foreground");
  return test;
};

export default foreground;
