import type { ApiCall, ApiResponse, Event } from "shim";
import { nanoid } from "nanoid";
import mitt from "mitt";
import { version } from "../../../../wander-wallet-api/package.json";
import { isApiErrorResponse } from "@wanderapp/isomorphic-messaging";
import { MittInjectedEvents } from "../../utils/events/events";
import { version as sdkVersion } from "../../../wander-connect-sdk/package.json";
import { ForegroundModule, foregroundModules } from "./foreground-modules";

export async function injectWanderWalletAPI(targetWindow: Window = window, embeddedOrigin?: string) {
  log(LOG_GROUP.SETUP, "injectWanderWalletAPI()");

  /** Init events */
  const events = mitt<MittInjectedEvents>();

  // TODO: Can we get the right type here?:
  const walletAPI = {
    walletName: import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "Wander Connect" : "ArConnect",
    walletVersion: version,
    events,
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
    params: any[],
  ): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      // 1. Find out what function are we calling:

      const functionName = typeof foregroundModule === "string" ? foregroundModule : foregroundModule.functionName;

      // 2. Get & prepare its params:
      // For `sign` and `dispatch`, this is where the params are send in chunks.
      const functionParams = typeof foregroundModule === "string" ? params : await foregroundModule.function(...params);

      // TODO: Use a default function for those that do not have/need one and
      // see if chunking can be done automatically or if it is needed at all:

      // 3. Prepare the message & payload to send:
      const callID = nanoid();
      const data: ApiCall = {
        app: import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? "wanderEmbedded" : "wander",
        version,
        callID,
        type: `api_${functionName}`,
        data: {
          params: functionParams,
        },
      };

      // 4. Send message to background script (Wander BE) or to the iframe window (Wander Embedded):

      const targetOrigin = import.meta.env?.VITE_IS_EMBEDDED_APP === "1" ? embeddedOrigin : window.location.origin;

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

        const { data: res } = e;

        // validate return message
        if (!data || `${data.type}_result` !== res.type) return;

        // only resolve when the result matching our callID is delivered
        if (data.callID !== res.callID) return;

        window.removeEventListener("message", callback);

        // check for errors
        if (isApiErrorResponse(res)) {
          return reject(res.data);
        }

        const finalizerFn = typeof foregroundModule === "string" ? null : foregroundModule.finalizer;

        // call the finalizer function if it exists
        if (finalizerFn) {
          try {
            const finalizerResult = await finalizerFn(res.data, functionParams, params);

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
      }
    });
  }

  // @ts-expect-error
  window.arweaveWallet = walletAPI;

  /** Handle events */
  window.addEventListener(
    "message",
    (
      e: MessageEvent<{
        type: "wander_event";
        event: Event;
      }>,
    ) => {
      if (!e.data || !e.data.event || e.data.type !== "wander_event") return;

      events.emit(e.data.event.name, e.data.event.value);
    },
  );

  // at the end of the injected script,
  // we dispatch the wallet loaded event

  async function dispatchArweaveWalletLoaded() {
    if (!window.arweaveWallet || window.arweaveWallet.walletName !== "ArConnect") return;

    const permissions = await window.arweaveWallet.getPermissions().catch(() => []);

    // Note that for Wander Connect we just need to dispatch this once, no need to subscribe to the window load event to re-dispatch it:
    dispatchEvent(
      new CustomEvent("arweaveWalletLoaded", {
        detail: {
          permissions,
        },
      }),
    );

    if (permissions.length > 0) {
      events.emit("connect", null);

      const [activeAddress, addresses] = await Promise.all([
        window.arweaveWallet.getActiveAddress().catch(() => ""),
        window.arweaveWallet.getAllAddresses().catch(() => []),
      ]);

      events.emit("activeAddress", activeAddress);
      events.emit("addresses", addresses);
    }
  }

  // Not sure there's a point in this, as the dApp will never be able to listen for it, but I'm maintaining the same structure we had before:
  dispatchArweaveWalletLoaded();

  // This doesn't work on page reload unless it's a hard load, as the event is dispatched earlier on reload, before the dApp can start listening, so...
  // window.addEventListener("load", dispatchArweaveWalletLoaded);

  // ...we can instead monkey patch `window.addEventListener` and re-dispatch the "arweaveWalletLoaded" event as soon as a new listener is added:

  const addEventListener_ = Window.prototype.addEventListener;

  Window.prototype.addEventListener = function (eventName: string, ...args) {
    if (eventName === "arweaveWalletLoaded") {
      dispatchArweaveWalletLoaded();
    }

    addEventListener_.call(this, eventName, ...args);
  };
}
