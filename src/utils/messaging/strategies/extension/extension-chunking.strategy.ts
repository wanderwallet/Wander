import { nanoid } from "nanoid";
import type { ApiCall, ApiResponse } from "shim";
import type { Chunk } from "~api/modules/sign/chunks";
import { isApiErrorResponse } from "~utils/messaging/common/messaging.utils";

/**
 * Send a chunk to the background script
 *
 * @param chunk Chunk to send
 *
 * @returns Response from the background
 */
export function sendChunk(chunk: Chunk) {
  return new Promise<void>(async (resolve, reject) => {
    const callID = nanoid();

    // construct message
    const message: ApiCall = {
      app: import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "wanderEmbedded" : "wander",
      // TODO: Add Wallet API version:
      version: "",
      callID,
      type: "chunk",
      data: chunk,
    };

    // send message
    window.postMessage(message, window.location.origin);

    // wait for the background to accept the chunk
    window.addEventListener("message", callback);

    // callback for the message
    function callback(e: MessageEvent<ApiResponse<number>>) {
      const { data: res } = e;

      if (!res) return;

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
}
