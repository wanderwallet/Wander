import LiquidOps from "liquidops";
import { ArweaveSigner, createData } from "@dha-team/arbundles";
import { getActiveKeyfile, type DecryptedWallet } from "~wallets";
import { isLocalWallet } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";

export const LiquidOpsClient = async () => {
  let decryptedWallet: DecryptedWallet;
  try {
    decryptedWallet = await getActiveKeyfile();
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
    const LiquidOpsClient = new LiquidOps(signer);
    return LiquidOpsClient;
  } catch (err) {
    console.log("Error in LiquidOps client: ", err);
  } finally {
    if (decryptedWallet && decryptedWallet.type === "local") {
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }
};
