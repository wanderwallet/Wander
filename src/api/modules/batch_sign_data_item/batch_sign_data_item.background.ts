import { isBatchOfRawDataItem } from "~utils/assertions";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import { getActiveKeyfile } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { ArweaveSigner, createData } from "arbundles";
import type { BackgroundModuleFunction } from "~api/background/background-modules";

const background: BackgroundModuleFunction<number[][]> = async (
  appData,
  dataItems: unknown
) => {
  // validate
  isBatchOfRawDataItem(dataItems);

  const results: number[][] = [];

  await requestUserAuthorization(
    {
      type: "batchSignDataItem",
      data: dataItems
    },
    appData
  );

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  try {
    if (decryptedWallet.type !== "local") {
      throw new Error(
        "Only local wallets are currently supported for batch signing"
      );
    }

    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);

    for (const dataItem of dataItems) {
      const { data, ...options } = dataItem;
      const binaryData = new Uint8Array(data);

      const dataEntry = createData(binaryData, dataSigner, options);

      await dataEntry.sign(dataSigner);

      results.push(Array.from<number>(dataEntry.getRaw()));
    }
  } finally {
    // @ts-expect-error
    freeDecryptedWallet(decryptedWallet.keyfile);
  }

  return results;
};

export default background;
