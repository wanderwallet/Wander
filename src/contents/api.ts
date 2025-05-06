import type { PlasmoCSConfig } from "plasmo";
import type { ApiCall } from "shim";
import injectedScript from "url:./injected/setup-wallet-sdk.injected-script.ts";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { isomorphicSendMessage } from "~isomorphic-messaging";

log(LOG_GROUP.SETUP, "api.ts");

export const config: PlasmoCSConfig = {
  matches: ["file://*/*", "http://*/*", "https://*/*"],
  run_at: "document_start",
  all_frames: true,
};

// inject API script into the window

const container = document.head || document.documentElement;
const script = document.createElement("script");

script.setAttribute("async", "false");
script.setAttribute("type", "text/javascript");
script.setAttribute("src", injectedScript);

container.insertBefore(script, container.children[0]);
container.removeChild(script);

// Receive API calls:
//
// Foreground modules (from `foreground-setup-wallet.ts`) will send messages as
// `window.postMessage(data, window.location.origin)`, which are received here. Because this is a (sandboxed) extension
// content script, it can use `sendMessage(...)` to talk to the background script.
//
// Note this part is not needed for Wander Embedded, because `postMessage(...)` can talk directly to the iframe:
//
//    iframeElement.contentWindow.postMessage(...);

window.addEventListener("message", async ({ data }: MessageEvent<ApiCall>) => {
  // verify that the call is meant for the extension
  if (data.app !== "wander") {
    return;
  }

  // verify that the call has an ID
  if (!data.callID) {
    throw new Error("The call does not have a callID");
  }

  log(LOG_GROUP.API, `${data.type} (${data.callID})...`);

  // send call to the background
  const res = await isomorphicSendMessage({
    destination: "background",
    messageId: data.type === "chunk" ? "chunk" : "api_call",
    data,
  });

  // TODO: If the call above fails, this API call never gets a response. Add timeout?

  log(LOG_GROUP.API, `${data.type} (${data.callID}) =`, res);

  // send the response to the injected script
  window.postMessage(res, window.location.origin);
});
