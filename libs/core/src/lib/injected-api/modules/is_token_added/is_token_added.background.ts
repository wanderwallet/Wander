import type { BackgroundModuleFunction } from "~api/background/background-modules";

const background: BackgroundModuleFunction<boolean> = async (_, id: string) => {
  throw new Error("The isTokenAdded API is deprecated and removed.");
};

export default background;
