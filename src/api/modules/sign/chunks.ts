import type { Tag } from "arweave/web/lib/transaction";
import type { ApiCall, ApiResponse } from "shim";
import { nanoid } from "nanoid";
import { isApiErrorResponse } from "~utils/messaging/common/messaging.utils";

/**
 * The chunk of the transaction signing
 */
export interface Chunk {
  collectionID: string; // unique ID for the collection, that is the parent of this chunk
  type: "tag" | "data" | "bytes" | "start" | "end";
  index: number; // index of the chunk, to make sure it is not in the wrong order
  value?: number[] | Tag; // Uint8Array converted to number array or a tag
}

/**
 * Size of a chunk in bytes
 */
export const CHUNK_SIZE = 500000;

// TODO: Store these in a map instead...
// stored chunks
const chunks: {
  chunkCollectionID: string; // unique ID for this collection
  origin: string; // tabID for verification
  rawChunks: Chunk[]; // raw chunks to be reconstructed
}[] = [];

/**
 * Send a chunk to the background script
 *
 * @param chunk Chunk to send
 *
 * @returns Response from the background
 */
export const sendChunk = (chunk: Chunk) =>
  new Promise<void>((resolve, reject) => {
    const callID = nanoid();

    // construct message
    const message: ApiCall = {
      app:
        import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
          ? "wanderEmbedded"
          : "wander",
      // TODO: Add Wallet API version:
      version: "",
      callID,
      type: "chunk",
      data: chunk
    };

    // send message
    window.postMessage(message, window.location.origin);

    // wait for the background to accept the chunk
    window.addEventListener("message", callback);

    // callback for the message
    function callback(e: MessageEvent<ApiResponse<number>>) {
      const { data: res } = e;

      // returned chunk index
      const index = res.data;

      // ensure we are getting the result of the chunk sent
      // in this instance / call of the function
      if (res.callID !== callID) return;

      // check for errors in the background
      if (isApiErrorResponse(res) || typeof index === "string") {
        reject(res.data);
      } else {
        resolve();
      }

      // remove listener
      window.removeEventListener("message", callback);
    }
  });

/**
 * Handle incoming chunks and add them to the chunk storage
 *
 * @param chunk Chunk object to handle
 * @param appURL URL the chunk originates from
 */
export function handleChunk(chunk: Chunk, appURL: string): number {
  // handle start chunk
  if (chunk.type === "start") {
    // begin listening for chunks
    // this initializes a new array element
    // with all the data for a future signing
    // the content of the chunks will get pushed
    // here
    chunks.push({
      chunkCollectionID: chunk.collectionID,
      origin: appURL,
      rawChunks: []
    });
    // handle other chunks
  } else {
    // find the key of the chunk collection that the
    // chunk belongs to
    // also check if the origin of the chunk matches
    // the origin of the tx creation
    const collectionID = chunks.findIndex(
      ({ chunkCollectionID, origin }) =>
        chunkCollectionID === chunk.collectionID && origin === appURL
    );

    // check if the chunk has a valid origin
    if (collectionID < 0) {
      throw new Error("Invalid origin or collection ID for chunk");
    }

    // push valid chunk for evaluation in the future
    chunks[collectionID].rawChunks.push(chunk);
  }

  // return chunk index for confirmation
  return chunk.index;
}

/**
 * Get chunks for a collectionID
 *
 * @param collectionID ID of the chunk collection to retrieve
 * @param appURL URL of the app the chunks originate from
 *
 * @returns Chunk collection
 */
export function getChunks(collectionID: string, appURL: string) {
  // find collection
  const collection = chunks.find(
    ({ chunkCollectionID, origin }) =>
      chunkCollectionID === collectionID && origin === appURL
  );

  return collection?.rawChunks;
}

/**
 * Remove a chunk collection
 *
 * @param collectionID ID of the chunk collection to remove
 */
export function cleanUpChunks(collectionID: string) {
  const index = chunks.findIndex(
    ({ chunkCollectionID }) => chunkCollectionID === collectionID
  );
  chunks.splice(index, 1);
}
