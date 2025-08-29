import { createData } from "@dha-team/arbundles";
import type { BackgroundModuleFunction } from "../../background/background-modules";
import { requestUserAuthorization } from "../../../auth/auth.utils";
import { isBatchOfRawDataItem, isSignatureOptions } from "../../../utils/assertions/assertions";
import { getActiveKeyfile } from "../../../wallets";
import { createArweaveSignerWithOptions } from "../../../utils/signer/signer.utils";

const background: BackgroundModuleFunction<number[][]> = async (
  appData,
  dataItems: unknown,
  signatureOptions?: unknown,
) => {
  // validate
  isBatchOfRawDataItem(dataItems);
  if (signatureOptions) isSignatureOptions(signatureOptions);

  const results: number[][] = [];

  await requestUserAuthorization(
    {
      type: "batchSignDataItem",
      data: dataItems,
    },
    appData,
  );

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  try {
    if (decryptedWallet.type !== "local") {
      throw new Error("Only local wallets are currently supported for batch signing");
    }

    const dataSigner = createArweaveSignerWithOptions(decryptedWallet.keyfile, signatureOptions);

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
