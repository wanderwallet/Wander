import { isRawDataItem } from "~utils/assertions";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import { getActiveKeyfile } from "~wallets";
import { freeDecryptedWallet } from "~wallets/encryption";
import { ArweaveSigner, createData } from "@dha-team/arbundles";
import type { RawDataItem } from "../sign_data_item/types";
import type { BackgroundModuleFunction } from "~api/background/background-modules";

const background: BackgroundModuleFunction<number[][]> = async (
  appData,
  dataItems: unknown[]
) => {
  // validate
  if (!Array.isArray(dataItems)) {
    throw new Error("Input must be an array of data items");
  }

  for (const dataItem of dataItems) {
    isRawDataItem(dataItem);
  }

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

    for (const dataItem of dataItems as RawDataItem[]) {
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
