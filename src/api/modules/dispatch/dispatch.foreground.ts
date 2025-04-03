import { deconstructTransaction } from "../sign/transaction_builder";
import { createCoinWithAnimation } from "../sign/animation";
import type Transaction from "arweave/web/lib/transaction";
import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import type { ModuleFunction } from "~api/module";
import type { DispatchResult } from "./index";
import { sendChunk } from "~isomorphic-chunking";

const foreground: ModuleFunction<Record<any, any>> = async (
  transaction: Transaction
) => {
  // create chunks
  const {
    transaction: tx, // transaction without data and tags
    dataChunks,
    tagChunks,
    chunkCollectionID
  } = deconstructTransaction(transaction);

  // we call the api and request it to start receiving
  // the chunks
  try {
    await sendChunk({
      collectionID: chunkCollectionID,
      type: "start",
      index: -1
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
      throw new Error(
        `Error while sending a data (dispatch) chunk of collection "${chunkCollectionID}": \n${e}`
      );
    }
  }

  // send tag chunks
  for (const chunk of tagChunks) {
    try {
      await sendChunk(chunk);
    } catch (e) {
      // chunk fail
      throw new Error(
        `Error while sending a tag chunk for tx from chunk collection "${chunkCollectionID}": \n${e}`
      );
    }
  }

  return [tx, chunkCollectionID];
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
