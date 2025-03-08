import { isRawDataItem } from "~utils/assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ArweaveSigner, createData } from "arbundles";
import Application from "~applications/application";
import { getActiveKeyfile, getActiveWallet } from "~wallets";
import { signAuthKeystone, type AuthKeystoneData } from "../sign/sign_auth";
import Arweave from "arweave";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import BigNumber from "bignumber.js";
import { createDataItem } from "~utils/data_item";
import { EventType, trackDirect } from "~utils/analytics";
import { checkIfUserNeedsToSign } from "../sign/sign_policy";

const background: BackgroundModuleFunction<number[]> = async (
  appData,
  dataItem: unknown
) => {
  // validate
  try {
    isRawDataItem(dataItem);
  } catch (err) {
    throw new Error(err);
  }

  const app = new Application(appData.url);
  // const allowance = await app.getAllowance();
  // const alwaysAsk = allowance.enabled && allowance.limit.eq(BigNumber("0"));
  let isTransferTx = false;
  let amount = "0";

  if (
    dataItem.tags?.some(
      (tag) => tag.name === "Action" && tag.value === "Transfer"
    ) &&
    dataItem.tags?.some(
      (tag) => tag.name === "Data-Protocol" && tag.value === "ao"
    )
  ) {
    isTransferTx = true;
    try {
      const quantityTag = dataItem.tags?.find((tag) => tag.name === "Quantity");
      if (quantityTag) {
        const quantityBigNum = BigNumber(quantityTag.value);

        // Ensure the quantity is a valid positive non-zero number (greater than 0)
        if (!quantityBigNum.isPositive() || quantityBigNum.isZero()) {
          throw new Error("INVALID_QUANTITY");
        }

        quantityTag.value = quantityBigNum.toFixed(0, BigNumber.ROUND_FLOOR);
        amount = quantityTag.value;
      }
    } catch (e) {
      if (e?.message === "INVALID_QUANTITY") {
        throw new Error("Quantity must be a valid positive non-zero number.");
      }
    }
  }

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  const signPolicy = await app.getSignPolicy();
  const alwaysAsk = checkIfUserNeedsToSign(
    signPolicy,
    dataItem,
    decryptedWallet.type
  );

  // get options and data
  const { data, ...options } = dataItem;
  const binaryData = new Uint8Array(data);

  if (decryptedWallet.type == "local") {
    // create bundlr tx as a data entry
    const dataSigner = new ArweaveSigner(decryptedWallet.keyfile);
    const dataEntry = createData(binaryData, dataSigner, options);

    // check allowance
    // const price = await getPrice(dataEntry, await app.getBundler());
    // we are no longer checking for allowance on this page

    // allowance or sign auth
    try {
      if (alwaysAsk) {
        await requestUserAuthorization(
          {
            type: "signDataItem",
            data: dataItem
          },
          appData
        );
      }
    } catch (e) {
      freeDecryptedWallet(decryptedWallet.keyfile);
      throw new Error(e?.message || e);
    }
    // sign item
    await dataEntry.sign(dataSigner);

    // update allowance spent amount (in winstons)
    // await updateAllowance(appData.url, price);

    // remove keyfile
    freeDecryptedWallet(decryptedWallet.keyfile);

    // analytics
    await trackSigned(app, appData.url, dataItem.target, amount, isTransferTx);

    return Array.from<number>(dataEntry.getRaw());
  } else {
    // create bundlr tx as a data entry
    const activeWallet = await getActiveWallet();
    if (activeWallet.type != "hardware") throw new Error("Invalid Wallet Type");
    const signerConfig = {
      signatureType: 1,
      signatureLength: 512,
      ownerLength: 512,
      publicKey: Buffer.from(
        Arweave.utils.b64UrlToBuffer(activeWallet.publicKey)
      )
    };
    const dataEntry = createDataItem(binaryData, signerConfig, options);
    try {
      const data: AuthKeystoneData = {
        type: "DataItem",
        data: dataEntry.getRaw()
      };
      const res = await signAuthKeystone(appData, data);
      dataEntry.setSignature(
        Buffer.from(Arweave.utils.b64UrlToBuffer(res.data.signature))
      );
    } catch (e) {
      throw new Error(e?.message || e);
    }
    // analytics
    await trackSigned(app, appData.url, dataItem.target, amount, isTransferTx);

    return Array.from<number>(dataEntry.getRaw());
  }
};

async function trackSigned(
  app: Application,
  appUrl: string,
  tokenId: string,
  amount: string,
  isTransferTx: boolean
) {
  try {
    if (isTransferTx && amount !== "0") {
      const appInfo = await app.getAppData();
      await trackDirect(EventType.SIGNED, {
        appName: appInfo.name,
        appUrl,
        tokenId,
        amount
      });
    }
  } catch {}
}

export default background;
