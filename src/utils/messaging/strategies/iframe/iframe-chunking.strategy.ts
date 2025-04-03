import { nanoid } from "nanoid";
import type { ApiCall } from "shim";
import type { Chunk } from "~api/modules/sign/chunks";
import { isApiErrorResponse } from "~utils/messaging/common/messaging.utils";
import { isomorphicSendMessage } from "~utils/messaging/strategies/extension/extension-messaging.strategy";

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

    const res = await isomorphicSendMessage({
      destination: "background",
      messageId: "chunk",
      data: message
    });

    if (isApiErrorResponse(res) || typeof res.data === "string") {
      return reject(res.data);
    }

    resolve();
  });
}
