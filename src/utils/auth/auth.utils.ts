import { onMessage, sendMessage } from "@arconnect/webext-bridge";
import { nanoid } from "nanoid";
import browser from "webextension-polyfill";
import { Mutex } from "~utils/mutex";
import { isomorphicSendMessage } from "~utils/messaging/messaging.utils";
import {
  isAuthErrorResult,
  type AuthErrorResult,
  type AuthRequestData,
  type AuthResult,
  type AuthSuccessResult,
  type AuthType,
  type ConnectAuthRequest
} from "~utils/auth/auth.types";
import type { ModuleAppData } from "~api/background/background-modules";
import {
  getActiveAddress,
  getWallets,
  openOrSelectWelcomePage
} from "~wallets";
import {
  AUTH_POPUP_UNLOCK_REQUEST_TTL_MS,
  ERR_MSG_NO_WALLETS_ADDED,
  ERR_MSG_UNLOCK_TIMEOUT
} from "~utils/auth/auth.constants";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { isError } from "~utils/error/error.utils";

const popupMutex = new Mutex();

type PopupCallback = (popupTabID: number) => void;

let popupUpdatedCallbacks: PopupCallback[] = [];
let popupClosedCallbacks: PopupCallback[] = [];

let POPUP_TAB_ID = -1;

function setPopupTabID(popupTabID: number) {
  log(LOG_GROUP.AUTH, "setPopupTabID =", popupTabID);

  POPUP_TAB_ID = popupTabID;

  if (popupTabID === -1) {
    popupClosedCallbacks.forEach((cb) => {
      cb(popupTabID);
    });

    popupClosedCallbacks = [];

    return;
  }

  popupUpdatedCallbacks.forEach((cb) => {
    cb(popupTabID);
  });

  popupUpdatedCallbacks = [];
}

function onPopupTabUpdated(cb: PopupCallback) {
  if (POPUP_TAB_ID !== -1) return cb(POPUP_TAB_ID);

  popupUpdatedCallbacks.push(cb);
}

export function onPopupClosed(cb: PopupCallback) {
  popupClosedCallbacks.push(cb);

  return () => {
    const cbIndex = popupClosedCallbacks.indexOf(cb);

    if (cbIndex !== -1) popupClosedCallbacks.splice(cbIndex, 1);
  };
}

export function resetPopupTabID() {
  setPopupTabID(-1);
}

export function getCachedAuthPopupWindowTabID() {
  return POPUP_TAB_ID;
}

export function getAuthPopupWindowTabID() {
  if (POPUP_TAB_ID !== -1) return Promise.resolve(POPUP_TAB_ID);

  return new Promise<number>((resolve) => {
    onPopupTabUpdated((popupTabID) => {
      resolve(popupTabID);
    });
  });
}

/**
 * Authenticate the user from the background script.
 * Creates a popup window to authenticate and returns
 * the result of the process.
 *
 * @param data Data to send to the auth window
 */
export async function requestUserAuthorization<T = any>(
  authRequestData: AuthRequestData,
  moduleAppData: ModuleAppData
) {
  log(LOG_GROUP.AUTH, `requestUserAuthorization("${authRequestData.type}")`);

  // create the popup
  const { authID, popupWindowTabID } = await createAuthPopup(
    authRequestData,
    moduleAppData
  );

  // wait for the results from the popup
  return await getPopupResponse<T>(authID, popupWindowTabID);
}

/**
 * Create or reuse an authenticator popup to handle an `AuthRequest`.
 *
 * @param data The data sent to the popup
 *
 * @returns ID of the authentication
 */
export async function createAuthPopup(
  authRequestData: null | AuthRequestData,
  moduleAppData: ModuleAppData
) {
  const unlock = await popupMutex.lock();

  try {
    const [activeAddress, wallets] = await Promise.all([
      getActiveAddress(),
      getWallets()
    ]);

    const hasWallets = activeAddress && wallets.length > 0;

    if (!hasWallets) {
      openOrSelectWelcomePage(true);

      unlock();

      throw new Error(ERR_MSG_NO_WALLETS_ADDED);
    }

    const popupWindowTab: browser.Tabs.Tab | null = await browser.tabs
      .get(POPUP_TAB_ID)
      .catch(() => null);

    if (
      popupWindowTab &&
      !popupWindowTab.url.startsWith(browser.runtime.getURL("tabs/auth.html"))
    ) {
      console.warn(
        `Auth popup URL (${popupWindowTab.url}) doesn't match "tabs/auth.html"`
      );
    }

    // TODO: In Embedded we are already in the right window, so no need to create one, just skip
    // this and make the authRequestData make it to the AuthRequestsProvider.

    try {
      if (!popupWindowTab) {
        // TODO: To center this, the injected tab should send the center or dimensions of the screen:

        const window = await browser.windows.create({
          url: `${browser.runtime.getURL("tabs/auth.html")}#/`,
          focused: true,
          type: "popup",

          // TODO: Use these dimensions for embedded too... (pass them rather than using a hardcoded value so that we can control updates)
          width: 385,
          height: 720
        });

        setPopupTabID(window.tabs[0].id);
      } else {
        log(LOG_GROUP.AUTH, "reusePopupTabID =", POPUP_TAB_ID);

        await browser.windows.update(popupWindowTab.windowId, {
          focused: true
        });
      }
    } catch (err) {
      console.warn(
        `Could not ${popupWindowTab ? "focus" : "open"} "tabs/auth.html":`,
        err
      );
    }

    let authID: string | undefined;

    if (authRequestData) {
      // Generate an unique id for the authentication to be checked later:
      authID = nanoid();

      log(
        LOG_GROUP.AUTH,
        `isomorphicSendMessage(authID = "${authID}", tabId = ${POPUP_TAB_ID})`
      );

      await isomorphicSendMessage({
        messageId: "auth_request",
        tabId: POPUP_TAB_ID,
        data: {
          ...authRequestData,
          url: moduleAppData.url,
          tabID: moduleAppData.tabID,
          authID,
          requestedAt: Date.now(),
          status: "pending"
        }
      });
    }

    return {
      authID,
      popupWindowTabID: POPUP_TAB_ID
    };
  } catch (err) {
    console.warn("Unexpected error in `createAuthPopup` =", err);
  } finally {
    unlock();
  }
}

type AuthResultCallback<T> = (data: T) => void;

const authResultCallbacks = new Map<string, AuthResultCallback<any>>();

function addAuthResultListener<T>(
  authID: string,
  popupWindowTabID: number,
  fn: AuthResultCallback<T>
) {
  authResultCallbacks.set(authID, fn);

  if (authResultCallbacks.size === 1) {
    onMessage("auth_result", ({ sender, data }) => {
      // validate sender by it's tabId
      if (sender.tabId !== popupWindowTabID) {
        console.warn(
          `auth_result for authID = ${authID} received from tabId = ${sender.tabId}, but ${popupWindowTabID} expected`
        );

        return;
      }

      const authResultCallback = authResultCallbacks.get(data.authID);

      if (!authResultCallback) {
        console.warn(
          `authID = ${data.authID} doesn't have an "auth_result" listener`
        );

        return;
      }

      authResultCallback(data);
    });
  }
}

function removeAuthResultListener(authID: string) {
  authResultCallbacks.delete(authID);
}

/**
 * Await for a browser message from the popup
 */
export function getPopupResponse<T>(authID: string, popupWindowTabID: number) {
  log(
    LOG_GROUP.AUTH,
    `getPopupResponse(authID = "${authID}", popupWindowTabID = ${popupWindowTabID})`
  );

  return new Promise<AuthSuccessResult<T>>(async (resolve, reject) => {
    startKeepAlive(authID);

    // This is redundant, as `auth.provider.ts` will close itself after AUTH_POPUP_UNLOCK_REQUEST_TTL_MS of inactivity
    // (not receiving, completing or selecting AuthRequests), but just in case the response ("auth_result") never
    // arrives, we have this here to make sure the dApp gets a response, eventually:
    const timeoutID = setTimeout(() => {
      reject(ERR_MSG_UNLOCK_TIMEOUT);
    }, AUTH_POPUP_UNLOCK_REQUEST_TTL_MS);

    addAuthResultListener<AuthSuccessResult<T>>(
      authID,
      popupWindowTabID,
      (data) => {
        stopKeepAlive(authID);
        clearTimeout(timeoutID);
        removeAuthResultListener(authID);

        if (!data) {
          log(LOG_GROUP.AUTH, `auth_result for authID = "${authID}" = Empty)`);

          reject(`Missing data from authID = "${authID}"s "auth_result"`);
        } else if (isAuthErrorResult(data)) {
          log(
            LOG_GROUP.AUTH,
            `auth_result for authID = "${authID}" = Error (${data.error})`
          );

          reject(data.error);
        } else {
          log(LOG_GROUP.AUTH, `auth_result for authID = "${authID}" = Success`);

          resolve(data);
        }
      }
    );
  });
}

/**
 * Send the result as a response to the auth
 *
 * @param type Type of the auth
 * @param authID ID of the auth
 * @param errorMessage Optional error message. If defined, the auth will fail with this message
 * @param data Auth data
 */
export async function replyToAuthRequest<T>(
  type: AuthType,
  authID: string,
  data?: T | Error
) {
  log(
    LOG_GROUP.AUTH,
    `replyToAuthRequest(type = "${type}", authID="${authID}")`
  );

  const response: AuthResult<T> = isError(data)
    ? ({
        type,
        authID,
        error: data.message
      } satisfies AuthErrorResult)
    : ({
        type,
        authID,
        data
      } satisfies AuthSuccessResult<T>);

  // send the response message
  await sendMessage("auth_result", response, "background");
}

// KEEP ALIVE ALARM:

let keepAliveInterval: number | null = null;

const activeAuthRequests = new Set();

const mutex = new Mutex();

/**
 * Function to send periodic keep-alive messages
 */
export async function startKeepAlive(authID: string) {
  const unlock = await mutex.lock();

  try {
    activeAuthRequests.add(authID);

    const activePopups = activeAuthRequests.size;

    if (activePopups > 0 && keepAliveInterval === null) {
      log(LOG_GROUP.AUTH, `startKeepAlive(${authID}) =`, activeAuthRequests);

      keepAliveInterval = setInterval(
        () => browser.alarms.create("keep-alive", { when: Date.now() + 1 }),
        20000
      );
    }
  } finally {
    unlock();
  }
}

/**
 * Function to stop sending keep-alive messages
 */
export async function stopKeepAlive(authID: string) {
  const unlock = await mutex.lock();

  try {
    activeAuthRequests.delete(authID);

    const activePopups = activeAuthRequests.size;

    if (activePopups <= 0 && keepAliveInterval !== null) {
      log(LOG_GROUP.AUTH, `stopKeepAlive(${authID}) =`, activeAuthRequests);

      browser.alarms.clear("keep-alive");
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  } finally {
    unlock();
  }
}

/**
 *
 */
export async function resetKeepAlive() {
  const unlock = await mutex.lock();

  try {
    activeAuthRequests.clear();

    if (keepAliveInterval !== null) {
      log(LOG_GROUP.AUTH, `resetKeepAlive() =`, activeAuthRequests);

      browser.alarms.clear("keep-alive");
      clearInterval(keepAliveInterval);
      keepAliveInterval = null;
    }
  } finally {
    unlock();
  }
}

/**
 * Returns true if both ConnectAuthRequest are the same.
 */
export function compareConnectAuthRequests(
  authRequest1: ConnectAuthRequest,
  authRequest2: ConnectAuthRequest
): boolean {
  return (
    authRequest1.appInfo.name === authRequest2.appInfo.name &&
    authRequest1.appInfo.logo === authRequest2.appInfo.logo &&
    authRequest1.gateway === authRequest2.gateway &&
    authRequest1.permissions.toSorted().join("-") ===
      authRequest2.permissions.toSorted().join("-")
  );
}
