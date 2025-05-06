import type { BackgroundModuleFunction } from "~api/background/background-modules";

/**
 * Background functionality of the module
 */
const background: BackgroundModuleFunction<string> = async (port, test: string) => {
  return "fffff";
};

export default background;
