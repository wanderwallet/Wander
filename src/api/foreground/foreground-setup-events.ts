import { isomorphicOnMessage } from "~utils/messaging/messaging.utils";

// Some backend handlers (`src/api/background/handlers/*`) will use `sendMessage(...)` to communicate with the
// `event.ts` content script, which in turn calls `postMessage()`, dispatches events or performs certain actions in the
// content script's context.
//
// In Wander Embedded, instead of using `onMessage`, we should listen for messages coming from the iframe itself.
// This also means that the background scripts, which in Wander Embedded run directly inside the iframe, need to be
// updated to send messages using `postMessage`.
//
// See https://stackoverflow.com/questions/16266474/javascript-listen-for-postmessage-events-from-specific-iframe

export function setupEventListeners() {
  // event emitter events
  isomorphicOnMessage("event", ({ data, sender }) => {
    if (sender.context !== "background") return;

    // send to mitt instance
    postMessage({
      type: "wander_event",
      event: data
    });
  });

  // listen for wallet switches
  /** @deprecated */
  isomorphicOnMessage("switch_wallet_event", ({ data, sender }) => {
    if (sender.context !== "background") return;

    // dispatch custom event
    dispatchEvent(
      new CustomEvent("walletSwitch", {
        detail: { address: data }
      })
    );
  });

  // This will never be used for the embedded wallet anyway:
  // Copy address in the content script (not possible in the background)
  isomorphicOnMessage("copy_address", async ({ sender, data: addr }) => {
    if (sender.context !== "background") return;

    const input = document.createElement("input");

    input.value = addr;

    document.body.appendChild(input);
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
  });
}
