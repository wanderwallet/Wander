import type { ApiCall, Event } from "shim";
import type { InjectedEvents } from "~utils/events";
import { nanoid } from "nanoid";
import {
  foregroundModules,
  type ForegroundModule
} from "~api/foreground/foreground-modules";
import mitt from "mitt";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { version } from "../../../package.json";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";
import { isApiErrorResponse } from "~utils/messaging/common/messaging.utils";
import { isomorphicSendMessage } from "~isomorphic-messaging";
import { setEmbeddedTargetIframe } from "~utils/messaging/strategies/iframe/iframe-messaging.strategy";
// import { version as sdkVersion } from "../../../wander-embedded-sdk/package.json";

export function setupEmbeddedWalletSDK(
  targetWindowOrIframe: Window | HTMLIFrameElement = window
) {
  log(LOG_GROUP.SETUP, "setupEmbeddedWalletSDK()");

  if (!(targetWindowOrIframe instanceof HTMLIFrameElement)) {
    throw new Error("Target for Wander Embedded must be an IFRAME element.");
  }

  setEmbeddedTargetIframe(targetWindowOrIframe);

  /** Init events */
  const events = mitt<InjectedEvents>();

  // TODO: Can we get the right type here?:
  const walletAPI = {
    walletName: IS_EMBEDDED_APP ? "Wander Embedded" : "ArConnect",
    walletVersion: version,
    events
  } as const;

  for (const mod of foregroundModules) {
    walletAPI[mod.functionName] = (...params: any[]) => {
      return callForegroundThenBackground(mod, params);
    };
  }

  /**
   * Utility function to handle the actual "call-foreground-then-background" flow.
   * This can be reused by the Proxy handler below.
   */
  async function callForegroundThenBackground(
    foregroundModule: string | ForegroundModule,
    params: any[]
  ): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      // 1. Find out what function are we calling:

      const functionName =
        typeof foregroundModule === "string"
          ? foregroundModule
          : foregroundModule.functionName;

      // 2. Get & prepare its params:
      // For `sign` and `dispatch`, this is where the params are send in chunks.
      const functionParams =
        typeof foregroundModule === "string"
          ? params
          : await foregroundModule.function(...params);

      // TODO: Use a default function for those that do not have/need one and
      // see if chunking can be done automatically or if it is needed at all:

      // 3. Prepare the message & payload to send:
      const callID = nanoid();
      const data: ApiCall = {
        app: IS_EMBEDDED_APP ? "wanderEmbedded" : "wander",
        version,
        callID,
        type: `api_${functionName}`,
        data: {
          params: functionParams
        }
      };

      // 4. Send message to background script (Wander BE) or to the iframe window (Wander Embedded):

      log(LOG_GROUP.API, `${data.type} (${data.callID})...`);

      // send call to the background
      const res = await isomorphicSendMessage({
        destination: "background",
        messageId: data.type === "chunk" ? "chunk" : "api_call",
        data
      });

      // TODO: If the call above fails, this API call never gets a response. Add timeout?

      log(LOG_GROUP.API, `${data.type} (${data.callID}) =`, res);

      // check for errors
      if (isApiErrorResponse(res)) {
        return reject(res.data);
      }

      const finalizerFn =
        typeof foregroundModule === "string"
          ? null
          : foregroundModule.finalizer;

      // call the finalizer function if it exists
      if (finalizerFn) {
        try {
          const finalizerResult = await finalizerFn(
            res.data,
            functionParams,
            params
          );

          // TODO: This is a bad check because the result could be falsy:
          // if the finalizer transforms data
          // update the result
          if (finalizerResult) {
            res.data = finalizerResult;
          }
        } catch (err) {
          reject(err);

          return;
        }
      }

      resolve(res.data);
    });
  }

  // @ts-expect-error
  window.arweaveWallet = walletAPI;
}
