import { deconstructTransaction } from "../sign/transaction_builder.js";
import { createCoinWithAnimation } from "../sign/animation.js";
import type Transaction from "arweave/web/lib/transaction";
import type { ModuleFunction } from "../../module";
import type { DispatchResult } from "./index.js";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import { sendChunk } from "@wanderapp/isomorphic-messaging";
import { TransformFinalizer } from "../../foreground/foreground-modules.js";

const foreground: ModuleFunction<Record<any, any>> = async (
  transaction: Transaction,
  signatureOptions?: SignatureOptions,
) => {
  // create chunks
  const {
    transaction: tx, // transaction without data and tags
    dataChunks,
    tagChunks,
    chunkCollectionID,
  } = deconstructTransaction(transaction);

  // we call the api and request it to start receiving
  // the chunks
  try {
    await sendChunk({
      collectionID: chunkCollectionID,
      type: "start",
      index: -1,
    });
  } catch (e) {
    // for some reason the chunk streaming was not accepted, most
    // likely because the site does not have the permission
    throw new Error(`Failed to initiate dispatch chunk stream: \n${e}`);
  }

  // send data chunks
  for (const chunk of dataChunks) {
    try {
      await sendChunk(chunk);
    } catch (e) {
      // chunk fail
      throw new Error(`Error while sending a data (dispatch) chunk of collection "${chunkCollectionID}": \n${e}`);
    }
  }

  // send tag chunks
  for (const chunk of tagChunks) {
    try {
      await sendChunk(chunk);
    } catch (e) {
      // chunk fail
      throw new Error(`Error while sending a tag chunk for tx from chunk collection "${chunkCollectionID}": \n${e}`);
    }
  }

  return [tx, chunkCollectionID, signatureOptions];
};

export const finalizer: TransformFinalizer<{
  arConfetti: string;
  res: DispatchResult;
}> = (result) => {
  // show a nice confetti eeffect, if enabled
  if (result.arConfetti) {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createCoinWithAnimation(result.arConfetti), i * 150);
    }
  }

  return result.res;
};

export default foreground;
