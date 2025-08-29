import type { ModuleFunction } from "../../module";

/**
 * Foreground functionality of the module
 */
const foreground: ModuleFunction<string> = async (test: string) => {
  console.log("foreground");
  return test;
};

export default foreground;
