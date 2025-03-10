// This file is just a placeholder with some pseudo-code for the injected code on ArConnect Embedded. That is, the code
// that's loaded in the consumer site's context.

import type { IframeHTMLAttributes } from "react";
import { setupEventListeners } from "~api/foreground/foreground-setup-events";
import { setupWalletSDK } from "~api/foreground/foreground-setup-wallet-sdk";
import { isomorphicOnMessage } from "~utils/messaging/messaging.utils";

let isWalletInitialized = false;

export type ArConnectEmbeddedVariant = "hidden" | "logo" | "summary";

export type ArConnectEmbeddedVariantPosition = "" | "";

export interface ArConnectEmbeddedHiddenVariantOptions {
  type: "hidden";
}

export interface ArConnectEmbeddedLogoVariantOptions {
  type: "logo";
  position: ArConnectEmbeddedVariantPosition;
  margin: string;
  // TODO: Missing theming options (colors, font...)
}

export interface ArConnectEmbeddedSummaryVariantOptions {
  type: "summary";
  position: ArConnectEmbeddedVariantPosition;
  margin: string;
  // TODO: Missing theming options (colors, font...)
}

export type ArConnectEmbeddedVariantOptions =
  | ArConnectEmbeddedHiddenVariantOptions
  | ArConnectEmbeddedLogoVariantOptions
  | ArConnectEmbeddedSummaryVariantOptions;

export interface CommonArConnectEmbeddedOptions {
  // UI:
  variant: ArConnectEmbeddedVariant | ArConnectEmbeddedVariantOptions;
  iframe?: HTMLIFrameElement | IframeHTMLAttributes<HTMLIFrameElement>;

  // Events:
  onOpen?: () => boolean;
  onClose?: () => boolean;
  onResize?: () => boolean;
  onAuth?: (userDetails: UserDetails) => boolean;
  onBalance?: (balances: Record<string, number>) => boolean;
  onInfo?: (data: AuthRequest | Notification) => boolean;
}

export interface ArConnectEmbeddedOptionsWithURL
  extends CommonArConnectEmbeddedOptions {
  url?: string;
}

export interface ArConnectEmbeddedOptionsWithClientID
  extends CommonArConnectEmbeddedOptions {
  clientID?: string;
}

export type ArConnectEmbeddedOptions =
  | ArConnectEmbeddedOptionsWithURL
  | ArConnectEmbeddedOptionsWithClientID;

export function isArConnectEmbeddedOptionsWithURL(
  options: ArConnectEmbeddedOptions
): options is ArConnectEmbeddedOptionsWithURL {
  return options.hasOwnProperty("url");
}

export function isIFrameElement(
  iframe: HTMLIFrameElement | IframeHTMLAttributes<HTMLIFrameElement>
): iframe is HTMLIFrameElement {
  return iframe instanceof HTMLIFrameElement;
}

export function initArConnectEmbedded(options: ArConnectEmbeddedOptions) {
  if (isWalletInitialized) {
    throw new Error("ArConnect Embedded has already been initialized");
  }

  const src = isArConnectEmbeddedOptionsWithURL(options)
    ? options.url
    : `https://${options.clientID}.embedded.arconnect.io/`;

  if (!/https:\/\/(\w{12,16})\.embedded\.arconnect\.io\/?/.test(src)) {
    throw new Error("Invalid URL or clientID");
  }

  // Create the iframe:

  let iframeElement: HTMLIFrameElement;

  if (isIFrameElement(options.iframe)) {
    iframeElement = options.iframe;

    if (iframeElement.src) {
      throw new Error(
        "The provided `options.iframe` already has a `src` value"
      );
    }
  } else {
    iframeElement = document.createElement("iframe");

    Object.entries(options.iframe).forEach(([key, value]) => {
      iframeElement.setAttribute(key, value);
    });
  }

  iframeElement.id ||= "arConnectEmbeddedIframe";
  iframeElement.src = src;

  // TODO: Create the rest of the HTML elements for the "floating button" (depending on options)

  // TODO: How to inject theme and fonts?
  // TODO: Add a shadow DOM to add the styles.

  document.body.appendChild(iframeElement);

  const iframeWindow = iframeElement.contentWindow;

  setIFrameWindow(iframeWindow);

  // api.ts:

  // Because in ArConnect Embedded the injected code is not sandboxed, we can simply call `injectWalletSDK()` instead of
  // having to inject `injected.ts` with a `<script>` tag to call it outside the sandbox:
  setupWalletSDK(iframeWindow);

  // events.ts:

  // In ArConnect Embedded, we need to listen for messages coming from the iframe itself, so we pass a reference to it to
  // `setupEventListeners()` to check that:
  setupEventListeners(iframeElement);

  // UI-related functions and event listeners:

  function open() {}

  function close() {}

  function resize() {}

  isomorphicOnMessage("embedded_open", (openMessage) => {
    if (options.onOpen && options.onOpen(openMessage.data) === false) return;

    open(openMessage.data);
  });

  isomorphicOnMessage("embedded_close", (closeMessage) => {
    if (options.onClose && options.onClose(closeMessage.data) === false) return;

    close(closeMessage.data);
  });

  isomorphicOnMessage("embedded_resize", (resizeMessage) => {
    if (options.onResize && options.onResize(resizeMessage.data) === false)
      return;

    resize(resizeMessage.data);
  });

  isomorphicOnMessage("embedded_auth", (authMessage) => {
    if (options.onAuth && options.onAuth(authMessage.data) === false) return;

    // TODO: Handle `authMessage` (can be authRequest, balance or notification)
  });

  isomorphicOnMessage("embedded_balance", (balanceMessage) => {
    if (options.onBalance && options.onBalance(authMessage.data) === false)
      return;

    // TODO: Handle `authMessage` (can be authRequest, balance or notification)
  });

  isomorphicOnMessage("embedded_info", (dataMessage) => {
    if (options.onInfo && options.onInfo(dataMessage.data) === false) return;

    // TODO: Handle `dataMessage` (can be authRequest, balance or notification)

    // TODO: Probably, authRequst and notification do not include details. They
    // are only sent to display a small "warning"/"alert" or counter icon somewhere.
  });

  return {
    iframeElement,
    open,
    close,
    resize
  };
}
