import type { TransactionInterface } from "arweave/web/lib/transaction";
import Transaction from "arweave/web/lib/transaction";
import type { Tag } from "arweave/web/lib/transaction";
import { type Chunk, CHUNK_SIZE } from "./chunks";
import { signedTxTags } from "./tags";
import { nanoid } from "nanoid";

/**
 * Transaction object **without** it's data or tags
 */
export interface SplitTransaction extends TransactionInterface {
  data: undefined;
  tags: undefined;
}

export function isSplitTransaction(
  tx: Transaction | SplitTransaction
): tx is SplitTransaction {
  return !(tx instanceof Transaction);
}

/**
 * Split an Uint8Array to chunks, per chunks value max size is limited to 0.5mb
 */
export const bytesToChunks = (
  data: Uint8Array,
  id: string,
  start_index: number
): Chunk[] => {
  const dataChunks: Chunk[] = [];

  for (let i = 0; i < Math.ceil(data.length / CHUNK_SIZE); i++) {
    const sliceFrom = i * CHUNK_SIZE;
    const chunkValue = data.slice(sliceFrom, sliceFrom + CHUNK_SIZE);

    dataChunks.push({
      collectionID: id,
      type: "bytes",
      index: i + start_index,
      value: Array.from(chunkValue)
    });
  }
  return dataChunks;
};

/**
 * Reconstruct bytes from chunks
 */
export const bytesFromChunks = (chunks: Chunk[]): Uint8Array => {
  chunks.sort((a, b) => a.index - b.index);

  const dataSize = getDataSize(chunks);
  const reconstructedData = new Uint8Array(dataSize);

  let previousLength = 0;

  for (const chunk of chunks) {
    if (chunk.type === "bytes") {
      const chunkBuffer = new Uint8Array(chunk.value as number[]);

      reconstructedData.set(chunkBuffer, previousLength);
      previousLength += chunkBuffer.length;
    }
  }
  return reconstructedData;
};

/**
 * Split the tags and the data of a transaction in
 * chunks and remove them from the transaction object
 *
 * @param transaction The transaction to split
 *
 * @returns The transaction (without data and tags) + tag chunks
 * and data chunks
 */
export function deconstructTransaction(transaction: Transaction) {
  // generate a unique ID for this transaction's chunks
  // since the transaction does not have an ID yet
  const collectionID = nanoid();

  // create tag chunks
  const tagChunks: Chunk[] = transaction.tags.map((value, index) => ({
    collectionID,
    type: "tag",
    index,
    value
  }));

  // the data array is split into chunks of 0.5 mb
  const dataChunks: Chunk[] = [];

  // map data into chunks of 0.5 mb = 500000 bytes
  for (let i = 0; i < Math.ceil(transaction.data.length / CHUNK_SIZE); i++) {
    const sliceFrom = i * CHUNK_SIZE;
    const chunkValue = transaction.data.slice(
      sliceFrom,
      sliceFrom + CHUNK_SIZE
    );

    dataChunks.push({
      collectionID,
      type: "data",
      // the index has to be added to the already
      // existing indexes of the tag chunks
      index: i + tagChunks.length,
      value: Array.from(chunkValue)
    });
  }

  // remove data and tag values from the tx object
  // so it can be sent in one. the data and the tag
  // objects are the only parts of the tx that can
  // become potentially large
  const tx: SplitTransaction = {
    ...transaction,
    data: undefined,
    tags: undefined
  };

  return {
    transaction: tx,
    tagChunks,
    dataChunks,
    chunkCollectionID: collectionID
  };
}

/**
 * Get Data size from transaction chunks
 *
 * @param chunks Chunks to reconstruct the transaction with
 *
 * @returns Data size
 */
export function getDataSize(chunks: Chunk[]): number {
  let dataSize = 0;

  for (const chunk of chunks) {
    if (chunk.type === "data" || chunk.type === "bytes") {
      dataSize += chunk.value?.length || 0;
    }
  }

  return dataSize;
}

/**
 * Construct a transaction from a split transaction
 * and it's chunks
 *
 * @param splitTransaction Transaction without tags and data
 * @param tagChunks Chunks to reconstruct the transaction with
 *
 * @returns Constructed transaction
 */
export function constructTransaction(
  splitTransaction: SplitTransaction,
  chunks: Chunk[]
) {
  // create base tx
  const transaction: TransactionInterface = splitTransaction;

  transaction.tags = [];

  // sort the chunks by their indexes to make sure
  // that we are not loading them in the wrong order
  chunks.sort((a, b) => a.index - b.index);

  // create a Uint8Array to reconstruct the data to
  const dataSize = getDataSize(chunks);
  const reconstructedData = new Uint8Array(dataSize);

  // previous buffer length in bytes (gets updated
  // in the loop below)
  let previousLength = 0;

  // loop through the raw chunks and reconstruct
  // the transaction fields: data and tags
  for (const chunk of chunks) {
    if (chunk.type === "data") {
      // handle data chunks
      // create a Uint8Array from the chunk value
      const chunkBuffer = new Uint8Array(chunk.value as number[]);

      // append the value of the chunk after the
      // previous array (using the currently filled
      // indexes with "previousLength")
      reconstructedData.set(chunkBuffer, previousLength);
      previousLength += chunkBuffer.length; // increase the previous length by the buffer size
    } else if (chunk.type === "tag") {
      // handle tag chunks by simply pushing them
      transaction.tags.push(chunk.value as Tag);
    }
  }

  // update the tx data with the reconstructed data
  transaction.data = reconstructedData;

  // return the built tx
  return transaction;
}

/**
 * Remove data and non-wander tags from a signed transaction
 *
 * @param transaction Transaction to deconstruct
 *
 * @returns Transaction without data and non-wander tags
 */
export function deconstructSignedTransaction(transaction: Transaction) {
  // filter tags (don't send back each tag, just the ones added by wander)
  // @ts-expect-error
  const tags = transaction.get("tags").filter((tag: Tag) => {
    const tagName = tag.get("name", { string: true, decode: true });

    return signedTxTags.find(({ name }) => name === tagName);
  });

  return {
    ...transaction,
    data: undefined,
    tags
  };
}
