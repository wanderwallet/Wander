import { isLocalWallet, isSplitTransaction } from "~utils/assertions";
import { constructTransaction } from "../sign/transaction_builder";
import { arconfettiIcon, signNotification } from "../sign/utils";
import { cleanUpChunks, getChunks } from "../sign/chunks";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { createData, ArweaveSigner } from "arbundles";
import { getPrice, uploadDataToTurbo } from "./uploader";
import type { DispatchResult } from "./index";
import { signedTxTags } from "../sign/tags";
import { getActiveKeyfile } from "~wallets";
import { isString } from "typed-assert";
import Application from "~applications/application";
import Arweave from "arweave";
import { ensureAllowanceDispatch } from "./allowance";
import { updateAllowance } from "../sign/allowance";
import BigNumber from "bignumber.js";
import { isError } from "~utils/error/error.utils";
import { ERR_MSG_USER_CANCELLED_AUTH } from "~utils/auth/auth.constants";
import { checkIfUserNeedsToSign } from "../sign/sign_policy";

type ReturnType = {
  arConfetti: string | false;
  res: DispatchResult;
};

const background: BackgroundModuleFunction<ReturnType> = async (
  appData,
  tx: unknown,
  chunkCollectionID: unknown
) => {
  // validate input
  isSplitTransaction(tx);
  isString(chunkCollectionID);

  // create client
  const app = new Application(appData.url);
  const arweave = new Arweave(await app.getGatewayConfig());

  // grab the user's keyfile
  const decryptedWallet = await getActiveKeyfile(appData);

  // ensure that the currently selected
  // wallet is not a local wallet
  isLocalWallet(decryptedWallet);

  const keyfile = decryptedWallet.keyfile;

  // get chunks for transaction
  const chunks = getChunks(chunkCollectionID, appData.url);

  // reconstruct the transaction from the chunks
  let transaction = arweave.transactions.fromRaw({
    ...constructTransaction(tx, chunks || []),
    owner: keyfile.n
  });

  // clean up chunks
  cleanUpChunks(chunkCollectionID);

  // grab tx data and tags
  const data = transaction.get("data", { decode: true, string: false });
  // @ts-expect-error
  const tags = (transaction.get("tags") as Tag[]).map((tag) => ({
    name: tag.get("name", { decode: true, string: true }),
    value: tag.get("value", { decode: true, string: true })
  }));

  // add Wander tags to the tag list
  tags.push(...signedTxTags);

  // get allowance
  const allowance = await app.getAllowance();

  // always ask
  // const alwaysAsk = allowance.enabled && allowance.limit.eq(BigNumber("0"));
  const signPolicy = await app.getSignPolicy();
  const alwaysAsk = checkIfUserNeedsToSign(
    signPolicy,
    transaction,
    decryptedWallet?.type
  );

  // attempt to create a bundle
  try {
    // create bundlr tx as a data entry
    const dataSigner = new ArweaveSigner(keyfile);
    const dataEntry = createData(data, dataSigner, { tags });

    // check allowance
    const price = await getPrice(dataEntry, await app.getBundler());

    await ensureAllowanceDispatch(
      dataEntry,
      appData,
      allowance,
      decryptedWallet.keyfile,
      price,
      alwaysAsk
    );

    // sign and upload bundler tx
    await dataEntry.sign(dataSigner);
    await uploadDataToTurbo(dataEntry, await app.getBundler());

    // update allowance spent amount (in winstons)
    // await updateAllowance(appData.url, price);

    // show notification
    // await signNotification(0, dataEntry.id, appData.url, "dispatch");

    // remove wallet from memory
    freeDecryptedWallet(keyfile);

    return {
      arConfetti: await arconfettiIcon(),
      res: {
        id: dataEntry.id,
        type: "BUNDLED"
      }
    };
  } catch (err) {
    if (isError(err) && err.message === ERR_MSG_USER_CANCELLED_AUTH) {
      throw err;
    }

    // TODO: If there's an error in the first request, the previous (already accepted) AuthRequest's UI should probably
    // reflect that. Maybe we could even reuse the same AuthRequest item instead of creating a separated one.

    // sign & post if there is something wrong with turbo
    // add Wander tags to the tx object
    for (const arcTag of signedTxTags) {
      transaction.addTag(arcTag.name, arcTag.value);
    }
    // calculate price
    const price = BigNumber(transaction.reward).plus(transaction.quantity);

    // ensure allowance
    await ensureAllowanceDispatch(
      transaction,
      appData,
      allowance,
      decryptedWallet.keyfile,
      price,
      alwaysAsk
    );

    // sign and upload
    await arweave.transactions.sign(transaction, keyfile);
    const uploader = await arweave.transactions.getUploader(transaction);

    while (!uploader.isComplete) {
      await uploader.uploadChunk();
    }

    // update allowance spent amount (in winstons)
    // await updateAllowance(appData.url, price);

    // show notification
    // await signNotification(price, transaction.id, appData.url);

    // remove wallet from memory
    freeDecryptedWallet(keyfile);

    return {
      arConfetti: await arconfettiIcon(),
      res: {
        id: transaction.id,
        type: "BASE"
      }
    };
  }
};

export default background;
