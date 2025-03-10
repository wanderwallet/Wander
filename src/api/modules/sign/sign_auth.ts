import { bytesToChunks, deconstructTransaction } from "./transaction_builder";
import type Transaction from "arweave/web/lib/transaction";
import {
  getAuthPopupWindowTabID,
  requestUserAuthorization
} from "../../../utils/auth/auth.utils";
import { nanoid } from "nanoid";
import type { ModuleAppData } from "~api/background/background-modules";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import type { Chunk } from "~api/modules/sign/chunks";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { AuthSuccessResult } from "~utils/auth/auth.types";

interface SignatureResult {
  id: string;
  signature: string;
}

/**
 * Request a manual signature for the transaction.
 * The user has to authenticate and sign the
 * transaction.
 *
 * @param tabURL App url
 * @param transaction Transaction to sign
 * @param address Address of the wallet that signs the tx
 */
export function signAuth(
  appData: ModuleAppData,
  transaction: Transaction,
  address: string
) {
  log(LOG_GROUP.AUTH, "signAuth()", transaction);

  return new Promise<AuthSuccessResult<SignatureResult | undefined>>(
    async (resolve, reject) => {
      // generate chunks
      const {
        transaction: tx,
        dataChunks,
        tagChunks,
        chunkCollectionID: collectionID
      } = deconstructTransaction(transaction);

      // start auth
      requestUserAuthorization<SignatureResult | undefined>(
        {
          type: "sign",
          address,
          transaction: tx,
          collectionID
        },
        appData
      )
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });

      const popupWindowTabID = await getAuthPopupWindowTabID();

      try {
        log(
          LOG_GROUP.CHUNKS,
          `Sending ${
            dataChunks.concat(tagChunks).length || 0
          } txs chunks for collection`,
          collectionID,
          "to popup",
          popupWindowTabID
        );

        for (const chunk of dataChunks.concat(tagChunks)) {
          await isomorphicSendMessage({
            destination: `popup@${popupWindowTabID}`,
            messageId: "auth_chunk",
            data: chunk
          });
        }

        log(
          LOG_GROUP.CHUNKS,
          `Sending "end" chunk for collection`,
          collectionID,
          "to popup",
          popupWindowTabID
        );

        const endChunk: Chunk = {
          collectionID,
          type: "end",
          index: dataChunks.concat(tagChunks).length
        };

        await isomorphicSendMessage({
          destination: `popup@${popupWindowTabID}`,
          messageId: "auth_chunk",
          data: endChunk
        });

        log(
          LOG_GROUP.CHUNKS,
          "Done sending txs chunks for collection",
          collectionID,
          "to popup",
          popupWindowTabID
        );
      } catch (err) {
        return reject(
          `Error in signAuth while sending a data chunk of collection "${collectionID}": \n${err}`
        );
      }
    }
  );
}

export type AuthKeystoneType = "Message" | "DataItem";

export interface AuthKeystoneData {
  type: AuthKeystoneType;
  data: Uint8Array;
}

export function signAuthKeystone(
  appData: ModuleAppData,
  dataToSign: AuthKeystoneData
) {
  log(LOG_GROUP.AUTH, "signAuthKeystone()");

  return new Promise<AuthSuccessResult<SignatureResult | undefined>>(
    async (resolve, reject) => {
      // generate chunks
      const collectionID = nanoid();
      const dataChunks = bytesToChunks(dataToSign.data, collectionID, 0);

      // start auth
      requestUserAuthorization<SignatureResult | undefined>(
        {
          type: "signKeystone",
          keystoneSignType: dataToSign.type,
          collectionID
        },
        appData
      )
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });

      const popupWindowTabID = await getAuthPopupWindowTabID();

      try {
        log(
          LOG_GROUP.CHUNKS,
          `Sending ${dataChunks.length || 0} txs chunks for collection`,
          collectionID,
          "to popup",
          popupWindowTabID
        );

        for (const chunk of dataChunks) {
          await isomorphicSendMessage({
            destination: `popup@${popupWindowTabID}`,
            messageId: "auth_chunk",
            data: chunk
          });
        }

        log(
          LOG_GROUP.CHUNKS,
          `Sending "end" chunk for collection`,
          collectionID,
          "to popup",
          popupWindowTabID
        );

        const endChunk: Chunk = {
          collectionID,
          type: "end",
          index: dataChunks.length
        };

        await isomorphicSendMessage({
          destination: `popup@${popupWindowTabID}`,
          messageId: "auth_chunk",
          data: endChunk
        });

        log(
          LOG_GROUP.CHUNKS,
          "Done sending txs chunks for collection",
          collectionID,
          "to popup",
          popupWindowTabID
        );
      } catch (err) {
        return reject(
          `Error in signAuthKeystone while sending a data chunk of collection "${collectionID}": \n${err}`
        );
      }
    }
  );
}
