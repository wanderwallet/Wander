import type { ApiCall, ApiResponse, Event } from "shim";
import type { InjectedEvents } from "~utils/events";
import { nanoid } from "nanoid";
import {
  foregroundModules,
  type ForegroundModule
} from "~api/foreground/foreground-modules";
import mitt from "mitt";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { version } from "../../../package.json";
// import { version as sdkVersion } from "../../../wander-embedded-sdk/package.json";

export function setupWalletSDK(targetWindow: Window = window) {
  log(LOG_GROUP.SETUP, "setupWalletSDK()");
  const isEmbedded = import.meta.env?.VITE_IS_EMBEDDED_APP === "1";

  /** Init events */
  const events = mitt<InjectedEvents>();

  // TODO: Can we get the right type here?:
  const walletAPI = {
    walletName: isEmbedded ? "ArConnect Embedded" : "ArConnect",
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
        app: isEmbedded ? "wanderEmbedded" : "wander",
        version,
        callID,
        type: `api_${functionName}`,
        data: {
          params: functionParams
        }
      };

      // 4. Send message to background script (ArConnect Extension) or to the iframe window (ArConnect Embedded):

      const targetOrigin = isEmbedded
        ? "http://localhost:5173"
        : window.location.origin;

      targetWindow.postMessage(data, targetOrigin);

      // TODO: Note this is replacing the following from `api.content-script.ts`, so the logic to await and get the response is missing with just the
      // one-line change above.
      //
      // const res = await sendMessage(
      //   data.type === "chunk" ? "chunk" : "api_call",
      //   data,
      //   "background"
      // );
      //
      // window.postMessage(res, window.location.origin);

      // TODO: Replace `postMessage` with `isomorphicSendMessage`, which should be updated to handle
      // chunking automatically based on data size, rather than relying on `sendChunk` to be called from
      // the foreground scripts manually.

      // 5. Wait for result from background:
      window.addEventListener("message", callback);

      // TODO: Declare outside (factory) to facilitate testing?
      async function callback(e: MessageEvent<ApiResponse>) {
        // TODO: Make sure the response comes from targetWindow.
        // See https://stackoverflow.com/questions/16266474/javascript-listen-for-postmessage-events-from-specific-iframe.

        let { data: res } = e;

        // validate return message
        if (`${data.type}_result` !== res.type) return;

        // only resolve when the result matching our callID is deleivered
        if (data.callID !== res.callID) return;

        window.removeEventListener("message", callback);

        // check for errors
        if (res.error) {
          return reject(res.data);
        }

        const finalizerFn =
          typeof foregroundModule === "string"
            ? null
            : foregroundModule.finalizer;

        // call the finalizer function if it exists
        if (finalizerFn) {
          const finalizerResult = await finalizerFn(
            res.data,
            functionParams,
            params
          );

          // if the finalizer transforms data
          // update the result
          if (finalizerResult) {
            res.data = finalizerResult;
          }
        }

        // check for errors after the finalizer
        if (res.error) {
          return reject(res.data);
        }

        // resolve promise
        return resolve(res.data);
      }
    });
  }

  /**
   * Create the Proxy object.
   */
  const proxyWallet = new Proxy<Record<string, any>>(walletAPI, {
    get(target, propKey: string) {
      // If the property is a symbol or some internal property:
      if (typeof propKey !== "string") {
        return Reflect.get(target, propKey);
      }

      // Get value from target if it exists
      const value = Reflect.get(target, propKey);
      if (value !== undefined) {
        return value;
      }

      // Forward generically or throw:
      return (...args: any[]) => {
        return callForegroundThenBackground(propKey, args);
      };
    }
  });

  // @ts-expect-error
  window.arweaveWallet = proxyWallet;

  // at the end of the injected script,
  // we dispatch the wallet loaded event
  dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));

  // send wallet loaded event again if page loaded
  window.addEventListener("load", () => {
    if (!window.arweaveWallet) return;
    dispatchEvent(new CustomEvent("arweaveWalletLoaded", { detail: {} }));
  });

  // TODO: Remove it before to make sure there's no duplicate listener?

  /** Handle events */
  window.addEventListener(
    "message",
    (
      e: MessageEvent<{
        type: "wander_event";
        event: Event;
      }>
    ) => {
      if (e.data.type !== "wander_event") return;

      events.emit(e.data.event.name, e.data.event.value);
    }
  );
}
