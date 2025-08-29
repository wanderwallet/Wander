import { ExtensionStorage } from "../../../utils/storage/storage";
import { BackgroundModuleFunction } from "../../background/background-modules";

const background: BackgroundModuleFunction<string> = async () => {
  const address = await ExtensionStorage.get("active_address");

  if (!address) throw new Error("No active address");

  return address;
};

export default background;
