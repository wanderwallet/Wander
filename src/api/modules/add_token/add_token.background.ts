import type { BackgroundModuleFunction } from "~api/background/background-modules";

const background: BackgroundModuleFunction<void> = async (
  appData,
  id: unknown,
  type?: unknown,
  dre_node?: unknown
) => {
  throw new Error("The addToken API is deprecated and removed.");
};

export default background;
