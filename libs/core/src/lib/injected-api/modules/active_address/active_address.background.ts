import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ExtensionStorage } from "~utils/storage";

const background: BackgroundModuleFunction<string> = async () => {
  const address = await ExtensionStorage.get("active_address");

  if (!address) throw new Error("No active address");

  return address;
};

export default background;
