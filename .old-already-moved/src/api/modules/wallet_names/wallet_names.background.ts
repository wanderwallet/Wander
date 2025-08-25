import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ERR_MSG_NO_WALLETS_ADDED } from "~utils/auth/auth.constants";
import { getWallets } from "~wallets";

type WalletNamesResult = {
  [address: string]: string;
};

const background: BackgroundModuleFunction<WalletNamesResult> = async () => {
  const wallets = await getWallets();

  if (wallets.length === 0) {
    // TODO: No Welcome page here?

    throw new Error(ERR_MSG_NO_WALLETS_ADDED);
  }

  // construct wallet names object
  const walletNames: WalletNamesResult = {};

  wallets.forEach(({ address, nickname }) => (walletNames[address] = nickname));

  return walletNames;
};

export default background;
