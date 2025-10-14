import LiquidOps from "liquidops";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { createDataItemSigner } from "~utils/aoconnect";

export const LiquidOpsClient = async (useWallet = false) => {
  let decryptedWallet: DecryptedWallet;

  try {
    decryptedWallet = useWallet
      ? await getActiveKeyfile()
      : {
          type: "local",
          nickname: "",
          address: "",
          keyfile: {} as JWKInterface,
        };
    isLocalWallet(decryptedWallet);

    const signer = createDataItemSigner(decryptedWallet.keyfile);
    const client = new LiquidOps(signer);

    return {
      client,
      free: () => {
        if (decryptedWallet && decryptedWallet.type === "local") {
          freeDecryptedWallet(decryptedWallet.keyfile);
        }
      },
    };
  } catch {
    if (decryptedWallet && decryptedWallet.type === "local") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
};
