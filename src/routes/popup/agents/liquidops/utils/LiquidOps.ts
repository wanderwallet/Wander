import LiquidOps from "liquidops";
import { ArweaveSigner, createData } from "@dha-team/arbundles";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { JWKInterface } from "arweave/web/lib/wallet";

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

    const createDataItemSigner =
      (wallet: any) =>
      async ({
        data,
        tags = [],
        target,
        anchor,
      }: {
        data: any;
        tags?: { name: string; value: string }[];
        target?: string;
        anchor?: string;
      }): Promise<{ id: string; raw: ArrayBuffer }> => {
        const signer = new ArweaveSigner(wallet);
        const dataItem = createData(data, signer, { tags, target, anchor });

        await dataItem.sign(signer);

        return {
          id: dataItem.id,
          // @ts-expect-error
          raw: dataItem.getRaw(),
        };
      };

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
