import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ExtensionStorage } from "~utils/storage";
import { getAoTokenBalance } from "~tokens/aoTokens/ao";
import { isAddress } from "~utils/assertions";

const background: BackgroundModuleFunction<string> = async (_, id?: string) => {
  // validate input
  isAddress(id);
  const address = await ExtensionStorage.get("active_address");

  const balance = (await getAoTokenBalance(address, id)).toString();

  return balance;
};

export default background;
