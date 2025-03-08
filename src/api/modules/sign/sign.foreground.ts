import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface";
import type { TransformFinalizer } from "~api/foreground/foreground-modules";
import { createCoinWithAnimation } from "./animation";
import type { ModuleFunction } from "~api/module";
import { sendChunk } from "./chunks";
import {
  deconstructTransaction,
  type SplitTransaction
} from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
import Arweave from "arweave";

type ReturnParams = [SplitTransaction, SignatureOptions, string];
type OriginalParams = [Transaction, SignatureOptions];

const foreground: ModuleFunction<ReturnParams> = async (
  transaction: Transaction,
  options: SignatureOptions
) => {
  /**
   * Part one, create chunks from the tags
   * and the data of the transaction
   */
  const {
    transaction: tx, // transaction without data and tags
    dataChunks,
    tagChunks,
    chunkCollectionID
  } = deconstructTransaction(transaction);

  /**
   * Part two, send the chunks to the background script
   */

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
    throw new Error(`Failed to initiate transaction chunk stream: \n${e}`);
  }

  // send data chunks
  for (const chunk of dataChunks) {
    try {
      await sendChunk(chunk);
    } catch (e) {
      // chunk fail
      throw new Error(
        `Error while sending a data chunk of collection "${chunkCollectionID}": \n${e}`
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

  /**
   * After sending the chunks, we let the injected
   * script continue it's job and send the actual
   * "sign_transaction" call, without the chunked
   * parameters.
   */
  return [tx, options, chunkCollectionID];
};

/**
 * After we receive the signature, we need to reconstruct the transaction
 */
export const finalizer: TransformFinalizer<
  {
    transaction: SplitTransaction;
    arConfetti: string;
  },
  any,
  OriginalParams
> = (result, params, [originalTransaction]) => {
  if (!result) throw new Error("No transaction returned");

  // we don't need the custom gateway config here
  // because we are only converting tx objects
  const arweave = new Arweave({
    host: "arweave.net",
    port: 443,
    protocol: "https"
  });

  // Reconstruct the transaction
  // Since the tags and the data are not sent
  // back, we need to add them back manually
  const decodeTransaction = arweave.transactions.fromRaw({
    ...result.transaction,
    // some wander tags are sent back, so we need to concat them
    tags: [
      ...(originalTransaction.tags || []),
      ...(result.transaction.tags || [])
    ],
    data: originalTransaction.data
  });

  // show a nice confetti eeffect, if enabled
  if (result.arConfetti) {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => createCoinWithAnimation(result.arConfetti), i * 150);
    }
  }

  // return the constructed transaction
  return decodeTransaction;
};

export default foreground;
