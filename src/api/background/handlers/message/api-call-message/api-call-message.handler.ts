import { isExactly, isNotUndefined, isString } from "typed-assert";
import { isApiCall } from "~utils/assertions";
import Application from "~applications/application";
import type {
  ApiErrorResponse,
  ApiResponse,
  ApiSuccessResponse,
  BaseApiMessage
} from "shim";
import browser from "webextension-polyfill";
import { getTab } from "~applications/tab";
import { pushEvent } from "~utils/events";
import { getAppURL } from "~utils/format";
import {
  backgroundModules,
  type ModuleAppData
} from "~api/background/background-modules";
import type { OnMessageCallback } from "~utils/messaging/messaging.types";
import { recordActivity } from "~utils/inactivity/inactivity.utils";

export const handleApiCallMessage: OnMessageCallback<"api_call"> = async ({
  data,
  sender
}): Promise<ApiResponse> => {
  // construct base message to extend and return
  const baseMessage: BaseApiMessage = {
    callID: data.callID,
    type: `${data.type}_result`,
    data: undefined
  };

  try {
    // validate message
    isExactly(
      sender.context,
      "content-script",
      "API call messages are only accepted from the injected-script -> content-script"
    );
    isApiCall(data);

    // fix params
    if (data.data?.params) {
      data.data.params = data.data.params.map((val) =>
        val === null ? undefined : val
      );
    }

    // grab the tab where the API call came from
    const tab = await getTab(sender.tabId);

    // if the tab is not found, reject the call
    isString(tab?.url, "Call coming from invalid tab");

    // find module to execute
    const functionName = data.type.replace("api_", "");
    const mod = backgroundModules.find(
      (mod) => mod.functionName === functionName
    );

    // if we cannot find the module, we return with an error
    isNotUndefined(mod, `API function "${functionName}" not found`);

    // grab app info:
    let app = new Application(getAppURL(tab.url));

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

      // update app value with the app belonging to the frame
      if (frame?.url) {
        app = new Application(getAppURL(frame.url));
      }
    }

    // check permissions
    const permissionCheck = await app.hasPermissions(mod.permissions);

    if (!permissionCheck.result) {
      throw new Error(
        `Missing permission(s) for "${functionName}": ${permissionCheck.missing.join(
          ", "
        )}`
      );
    }

    // check if site is blocked
    if (await app.isBlocked()) {
      throw new Error(`${app.url} is blocked from interacting with Wander`);
    }

    // update events
    await pushEvent({
      type: data.type,
      app: app.url,
      date: Date.now()
    });

    // Record user activity for inactivity tracking
    recordActivity();

    // handle function
    const functionResult = await mod.function(
      {
        tabID: tab.id,
        url: app.url,
        favicon: tab.favIconUrl
      } satisfies ModuleAppData,
      ...(data.data.params || [])
    );

    // return result
    return {
      ...baseMessage,
      data: functionResult
    } satisfies ApiSuccessResponse;
  } catch (e) {
    console.error(
      `[Wander API] (${baseMessage.type} / ${data.type})`,
      e?.message || e
    );

    // return error
    return {
      ...baseMessage,
      error: true,
      data: e?.message || e
    } satisfies ApiErrorResponse;
  }
};
