import { ExtensionStorage } from "~utils/storage";
import { getWallets } from "~wallets";

/**
 * Hardware wallet reference
 */
export interface HardwareWallet {
  type: "hardware";
  api: HardwareApi;
  nickname: string;
  address: string;
  publicKey: string;
  xfp: string;
}

/**
 * Available hardware wallet APIs
 */
export type HardwareApi = "keystone";

interface InitHardwareWallet {
  address: string;
  publicKey: string;
  xfp: string;
}

/**
 * Add a hardware wallet
 *
 * @param init Hardware wallet data
 * @param api API type
 */
export async function addHardwareWallet({ address, publicKey, xfp }: InitHardwareWallet, api: HardwareApi) {
  // get wallets
  const wallets = await getWallets();

  // don't add if wallet is already added
  if (wallets.find((wallet) => wallet.address === address)) {
    return;
  }

  // keystone wallet count
  const keystoneCount = wallets.filter((wallet) => wallet?.type === "hardware" && wallet?.api === "keystone").length;

  // push
  wallets.push({
    type: "hardware",
    api,
    nickname: `Keystone ${keystoneCount + 1}`,
    address,
    publicKey,
    xfp,
  });

  // save data
  await ExtensionStorage.set("wallets", wallets);
}
