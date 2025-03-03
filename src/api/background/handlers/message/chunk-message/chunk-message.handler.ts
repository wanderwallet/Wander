import { isExactly, isString } from "typed-assert";
import type { OnMessageCallback } from "@arconnect/webext-bridge";
import { type Chunk, handleChunk } from "../../../../modules/sign/chunks";
import { isChunk } from "~utils/assertions";
import type { ApiCall, ApiResponse } from "shim";
import browser from "webextension-polyfill";
import { getTab } from "~applications/tab";
import { getAppURL } from "~utils/format";

export const handleChunkMessage: OnMessageCallback<
  // @ts-expect-error
  ApiCall<Chunk>,
  ApiResponse<number>
> = async ({ data, sender }) => {
  // construct base message to extend and return
  const baseMessage: ApiResponse = {
    type: "chunk_result",
    callID: data.callID
  };

  try {
    // validate message
    isExactly(
      sender.context,
      "content-script",
      "Chunk messages are only accepted from the injected-script -> content-script"
    );
    isChunk(data.data);

    // grab the tab where the chunk came
    const tab = await getTab(sender.tabId);

    // if the tab is not found, reject the call
    isString(tab?.url, "Call coming from invalid tab");

    // raw url where the chunk originates from
    let url = tab.url;

    // if the frame ID is defined, the API
    // request is not coming from the main tab
    // but from an iframe in the tab.
    // we need to treat the iframe as a separate
    // application to ensure the user does not
    // mistake it for the actual app
    if (typeof sender.frameId !== "undefined") {
      const frame = await browser.webNavigation.getFrame({
        frameId: sender.frameId,
        tabId: sender.tabId
      });

      // update url value with the url belonging to the frame
      if (frame.url) url = frame.url;
    }

    // call the chunk handler
    const index = handleChunk(data.data, getAppURL(url));

    return {
      ...baseMessage,
      data: index
    };
  } catch (e) {
    // return error
    return {
      ...baseMessage,
      error: true,
      data: e?.message || e
    };
  }
};
