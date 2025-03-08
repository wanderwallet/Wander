import { arconfettiIcon, calculateReward, signNotification } from "./utils";
import { allowanceAuth, getAllowance, updateAllowance } from "./allowance";
import { freeDecryptedWallet } from "~wallets/encryption";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { type JWKInterface } from "arweave/web/lib/wallet";
import { isSignatureOptions, isSplitTransaction } from "~utils/assertions";
import { cleanUpChunks, getChunks } from "./chunks";
import type { BackgroundResult } from "./index";
import { getActiveKeyfile } from "~wallets";
import { isString } from "typed-assert";
import { signAuth } from "./sign_auth";
import { signedTxTags } from "./tags";
import {
  constructTransaction,
  deconstructSignedTransaction
} from "./transaction_builder";
import Application from "~applications/application";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { EventType, trackDirect } from "~utils/analytics";
import BigNumber from "bignumber.js";
import { checkIfUserNeedsToSign } from "./sign_policy";

const background: BackgroundModuleFunction<BackgroundResult> = async (
  appData,
  tx: unknown,
  options: unknown | undefined | null,
  chunkCollectionID: unknown
) => {
  // validate input
  isSplitTransaction(tx);
  isString(chunkCollectionID);

  if (options) isSignatureOptions(options);

  // grab the user's keyfile
  const activeWallet = await getActiveKeyfile(appData);

  // app instance
  const app = new Application(appData.url);

  // create arweave client
  const arweave = new Arweave(await app.getGatewayConfig());

  // get chunks for transaction
  const chunks = getChunks(chunkCollectionID, appData.url);

  // get keyfile for active wallet
  // @ts-expect-error
  const keyfile: JWKInterface | undefined = activeWallet.keyfile;

  // reconstruct the transaction from the chunks
  let transaction = arweave.transactions.fromRaw({
    ...constructTransaction(tx, chunks || []),
    owner: keyfile?.n
  });

  // clean up chunks
  cleanUpChunks(chunkCollectionID);

  // append fee multiplier to the transaction
  transaction.reward = await calculateReward(transaction);

  // add Wander tags to the transaction
  for (const tag of signedTxTags) {
    transaction.addTag(tag.name, tag.value);
  }

  // fixup signature options
  // if it is null, the arweave-js webcrypto driver
  // will error
  if (options === null) options = undefined;

  // validate the user's allowance for this app
  // if it is not enough, we need the user to
  // raise it or cancel the transaction
  const price = BigNumber(transaction.reward).plus(transaction.quantity);

  // get allowance
  // const allowance = await getAllowance(appData.url);

  // always ask
  // const alwaysAsk = allowance.enabled && allowance.limit.eq(BigNumber("0"));

  const signPolicy = await app.getSignPolicy();

  // check if user needs to sign
  const userNeedsToSign = checkIfUserNeedsToSign(
    signPolicy,
    transaction,
    activeWallet.type
  );

  // check if user needs to sign
  // if userNeedsToSign is true, then we'll need to signAuth popup
  if (userNeedsToSign) {
    // get address of keyfile
    const addr =
      activeWallet.type === "local"
        ? await arweave.wallets.jwkToAddress(keyfile)
        : activeWallet.address;

    try {
      // auth before signing
      const res = await signAuth(appData, transaction, addr);

      if (res.data && activeWallet.type === "hardware") {
        transaction.setSignature({
          ...res.data,
          owner: activeWallet.publicKey
        });
      }
    } catch {
      // remove wallet from memory
      if (keyfile) {
        freeDecryptedWallet(keyfile);
      }

      throw new Error("User failed to sign the transaction manually");
    }
  } // else if (allowance.enabled && activeWallet.type === "local") {
  //   // authenticate user if the allowance
  //   // limit is reached
  //   try {
  //     await allowanceAuth(appData, allowance, price, alwaysAsk);
  //   } catch (e) {
  //     freeDecryptedWallet(keyfile);
  //     throw new Error(e?.message || e);
  //   }
  // }

  // sign the transaction if local wallet
  if (activeWallet.type === "local") {
    await arweave.transactions.sign(transaction, keyfile, options);

    browser.alarms.create(`scheduled-fee.${transaction.id}.${appData.url}`, {
      when: Date.now() + 2000
    });
  }

  // notify the user of the signing
  // await signNotification(price, transaction.id, appData.url);

  // update allowance spent amount (in winstons)
  // await updateAllowance(appData.url, price);

  // de-construct the transaction:
  // remove "tags" and "data", so we don't have to
  // send those back in chunks
  // instead we can re-construct the transaction again
  // in the foreground function, which improves speed
  const returnTransaction = deconstructSignedTransaction(transaction);

  // remove wallet from memory
  if (keyfile) {
    freeDecryptedWallet(keyfile);
  }
  // analytics
  await trackDirect(EventType.SIGNED, {
    appUrl: appData.url,
    totalInAR: arweave.ar.winstonToAr(price.toString())
  });

  // return de-constructed transaction
  return {
    transaction: returnTransaction,
    arConfetti: await arconfettiIcon()
  };
};

export default background;
