import { getWallets } from "../../../wallets/wallets.utils";
import type { BackgroundModuleFunction } from "../../background/background-modules";

const background: BackgroundModuleFunction<string[]> = async () => {
  // retrive wallets
  const wallets = await getWallets();

  if (wallets.length === 0) {
    throw new Error("No wallets stored");
  }

  return wallets.map((wallet) => wallet.address);
};

export default background;
