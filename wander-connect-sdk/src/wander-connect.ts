import { injectWanderConnectWalletAPI } from "wallet-api/wallet-sdk.es.js";
import { Button } from "./components/button/button.component";
import { Iframe } from "./components/iframe/iframe.component";
import { merge } from "ts-deepmerge";
import {
  AuthInfo,
  BalanceInfo,
  OpenReason,
  RequestsInfo,
  RouteConfig,
  ThemeSetting,
  WanderConnectOptions,
} from "./wander-connect.types";
import { IncomingRequestMessageData } from "./utils/message/message.types";
import { isEventMessage, isIncomingMessage, isWalletSwitchMessage } from "./utils/message/message.utils";
import { getWanderConnectAppURL } from "./utils/url/url.utils";

const NOOP = () => {};

/**
 * WanderEmbedded provides a wallet interface for Arweave applications
 *
 * This SDK creates and manages:
 * - An iframe that loads the Wander wallet interface
 * - An optional button component for user interaction
 * - Communication between the hosting application and the wallet
 *
 * When initialized, it automatically sets up `window.arweaveWallet` to enable
 * interaction with Arweave applications.
 *
 * @example
 * ```typescript
 * const wallet = new WanderEmbedded({
 *   clientId: 'your-client-id',
 *   onAuth: (user) => console.log('User authenticated:', user)
 * });
 *
 * // Open the wallet interface
 * wallet.open();
 *
 * // You can also use window.arweaveWallet which is automatically set up
 * async function connectWallet() {
 *   await window.arweaveWallet.connect(["ACCESS_ADDRESS", "SIGN_TRANSACTION"]);
 *   const address = await window.arweaveWallet.getActiveAddress();
 *   console.log("Connected to wallet address:", address);
 * }
 * ```
 */
export class WanderConnect {
  private static instance: WanderConnect | null = null;

  static WANDER_CONNECT_WALLET_NAME = "Wander Connect" as const;

  static AUTH_STATE_LS_KEY = "WANDER_CONNECT_AUTH_STATE" as const;

  static BROWSER_WALLET_ENABLED_KEY = "WANDER_CONNECT_BROWSER_WALLET_ENABLED" as const;

  static DEFAULT_IFRAME_SRC = "https://connect.wander.app/" as const;

  static DEFAULT_THEME = "system" as const satisfies ThemeSetting;

  // Callbacks:
  private onAuth: (authInfo: AuthInfo) => void = NOOP;
  private onOpen: () => void = NOOP;
  private onClose: () => void = NOOP;
  private onResize: (routeConfig: RouteConfig) => void = NOOP;
  private onBalance: (balanceInfo: BalanceInfo) => void = NOOP;
  private onRequest: (data: RequestsInfo) => void = NOOP;

  // Components:
  private buttonComponent: null | Button = null;
  private iframeComponent: null | Iframe = null;

  // State:
  private iframeRef: null | HTMLIFrameElement = null;
  private openReason: OpenReason | null = null;
  private allowOpeningAutomatically = true;

  /**
   * Contains the current authentication state of the SDK, and it is initialized with cached data in order to show as
   * soon as possible the non-auth or the loading auth version of the SDK.
   */
  public authInfo: AuthInfo = {
    authType: null,
    authStatus: "not-authenticated",
    userDetails: null,
  };

  /**
   * Current route configuration including dimensions and layout preferences
   */
  public routeConfig: RouteConfig | null = null;

  /**
   * User's current balance information
   */
  public balanceInfo: BalanceInfo | null = null;

  /**
   * Number of pending requests awaiting user action
   */
  public pendingRequests: number = 0;

  // Injected APIs:

  private isWalletReady = false;

  private isBrowserWalletEnabled = false;

  private windowArweaveWallet: any = null;

  /**
   * Creates a new instance of the WanderEmbedded SDK
   *
   * Initializes the wallet interface with the provided configuration options.
   * Only one instance of WanderEmbedded can exist at a time.
   *
   * @param options Configuration options for the SDK including:
   *   - clientId: Required identifier for your application
   *   - baseURL: Optional custom URL for the embedded iframe
   *   - baseServerURL: Optional custom URL for the API server
   *   - iframe: Configuration for the iframe (layout, styling, behavior)
   *   - button: Configuration for the button (position, styling, behavior)
   *   - callbacks: onAuth, onOpen, onClose, onResize, onBalance, onRequest
   * @throws Error if an instance already exists or if clientId is not provided
   */
  constructor(options: WanderConnectOptions) {
    if (WanderConnect.instance) {
      throw new Error(
        "WanderEmbedded instance already exists. Make sure you call `instance.destroy()` before instantiating it again.",
      );
    }

    WanderConnect.instance = this;

    // Callbacks:
    this.onAuth = options.onAuth ?? NOOP;
    this.onOpen = options.onOpen ?? NOOP;
    this.onClose = options.onClose ?? NOOP;
    this.onResize = options.onResize ?? NOOP;
    this.onBalance = options.onBalance ?? NOOP;
    this.onRequest = options.onRequest ?? NOOP;

    // TODO: Merge options properly:

    const optionsWithDefaults = merge(
      {
        clientId: "",
        iframe: {
          clickOutsideBehavior: true,
        },
        button: true,
      } satisfies WanderConnectOptions,
      options || {},
    );

    if (optionsWithDefaults.clientId !== "FREE_TRIAL") {
      throw new Error(
        `The clientId option is required and must be set to "FREE_TRIAL". This will change in the future, when you'll be required to register your app(s) to get a valid client ID.`,
      );
    }

    try {
      const authInfo = JSON.parse(localStorage.getItem(WanderConnect.AUTH_STATE_LS_KEY) || "null");

      if (authInfo) {
        // We initialize it as "loading" as we cannot still trust the cached data. The session still needs to be verified:
        this.authInfo = {
          authType: authInfo.authType || null,
          authStatus: "loading",
          userDetails: authInfo.userDetails || null,
        };
      }
    } catch (err) {
      console.warn("Error parsing last authentication state:", err);
    }

    try {
      this.isBrowserWalletEnabled = localStorage.getItem(WanderConnect.BROWSER_WALLET_ENABLED_KEY) === "true";
    } catch (err) {
      console.warn("Error parsing last native wallet enabled:", err);
    }

    // Create or get references to iframe and, maybe, button:
    this.initializeComponents(optionsWithDefaults);

    if (!this.iframeRef) throw new Error("Error creating iframe");

    // Bind message handler function:
    this.handleMessage = this.handleMessage.bind(this);

    // Start listening for app => SDK messages:
    window.addEventListener("message", this.handleMessage);

    // We get a reference to any other `window.arweaveWallet` (most likely our BE), in case we need to swap them back:
    if (window.arweaveWallet && window.arweaveWallet?.walletName !== WanderConnect.WANDER_CONNECT_WALLET_NAME) {
      this.windowArweaveWallet = window.arweaveWallet;
    }

    // We inject the embedded wallet API, unless the user has previously selected using the native wallet:
    this.injectWanderConnectWalletAPI(this.iframeRef);
  }

  private injectWanderConnectWalletAPI(iframeRef: HTMLIFrameElement) {
    if (this.isBrowserWalletEnabled || window.arweaveWallet?.walletName === WanderConnect.WANDER_CONNECT_WALLET_NAME)
      return;

    this.isWalletReady = false;

    injectWanderConnectWalletAPI(iframeRef);
  }

  private restoreBrowserWalletAPI() {
    // This functions only does something if the currently injected wallet IS Wander Connect:
    if (!this.isBrowserWalletEnabled || window.arweaveWallet?.walletName !== WanderConnect.WANDER_CONNECT_WALLET_NAME)
      return;

    this.isWalletReady = false;

    window.arweaveWallet = this.windowArweaveWallet;
  }

  private async dispatchWalletLoadedEvents() {
    if (this.isBrowserWalletEnabled || this.isWalletReady) return;

    this.isWalletReady = true;

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
      this.buttonComponent?.setStatus("isConnected");
    } else {
      this.buttonComponent?.unsetStatus("isConnected");
    }

    const events = window.arweaveWallet?.events;

    if (events && permissions.length > 0) {
      events.emit("connect", null);

      const [activeAddress, addresses] = await Promise.all([
        window.arweaveWallet.getActiveAddress().catch(() => ""),
        window.arweaveWallet.getAllAddresses().catch(() => []),
      ]);

      events.emit("activeAddress", activeAddress);
      events.emit("addresses", addresses);
    }
  }

  private initializeComponents(options: WanderConnectOptions): void {
    const {
      clientId,
      baseURL = WanderConnect.DEFAULT_IFRAME_SRC,
      theme = WanderConnect.DEFAULT_THEME,
      hideBE,
      baseServerURL,
    } = options;

    // Deep clone these objects so that we don't mutate the original, developer-provider ones:
    const iframeOptions = structuredClone(options.iframe || {});
    const buttonOptions = options.button === true ? {} : structuredClone(options.button || {});

    const srcWithParams = getWanderConnectAppURL({
      baseURL,
      clientId,
      theme,
      hideBE,
      baseServerURL,
    });

    if (iframeOptions instanceof HTMLElement) {
      if (iframeOptions.src && iframeOptions.src !== srcWithParams) {
        console.warn(`Replacing iframe.src ("${iframeOptions.src}") with ${srcWithParams}`);
      }

      iframeOptions.src = srcWithParams;

      this.iframeRef = iframeOptions;
    } else {
      iframeOptions.theme ||= theme;

      this.iframeComponent = new Iframe(srcWithParams, iframeOptions);

      const elements = this.iframeComponent.getElements();

      this.iframeRef = elements.iframe;

      if (iframeOptions?.clickOutsideBehavior) {
        elements.backdrop.addEventListener("click", () => {
          this.close();
        });
      }
    }

    if (typeof buttonOptions === "object") {
      buttonOptions.theme ||= theme;

      this.buttonComponent = new Button(buttonOptions);

      this.buttonComponent.setVariant(this.authInfo.authStatus || "not-authenticated");

      const elements = this.buttonComponent.getElements();

      elements.parent.appendChild(elements.host);

      this.handleButtonClick = this.handleButtonClick.bind(this);
      elements.button.addEventListener("click", this.handleButtonClick);
    }

    if (this.iframeComponent) {
      document.body.appendChild(this.iframeComponent.getElements().host);
    }
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    const message = event.data;

    if (!this.iframeRef || event.origin !== new URL(this.iframeRef.src).origin) return;

    if (isEventMessage(message) && this.isWalletReady) {
      // Note we cannot handle this by doing `window.arweaveWallet.events.on("connect" | "disconnect" | "permissions", ...)`
      // as that API is available to the dApp, which might do `window.arweaveWallet.events.off("connect" | "disconnect" | "permissions", ...)`
      // and break the SDK functionality:

      // "permissions" won't be dispatched when the app is disconnected, so we also need to listen to "disconnect":

      if ((message.data.name === "permissions" && message.data.value.length > 0) || message.data.name === "connect") {
        this.buttonComponent?.setStatus("isConnected");
      } else if (
        (message.data.name === "permissions" && message.data.value.length === 0) ||
        message.data.name === "disconnect"
      ) {
        this.buttonComponent?.unsetStatus("isConnected");
      }

      const events = window.arweaveWallet?.events;

      if (events) events.emit(message.data.name, message.data.value);

      return;
    }

    if (isWalletSwitchMessage(message)) {
      dispatchEvent(
        new CustomEvent("walletSwitch", {
          detail: { address: message.data },
        }),
      );

      return;
    }

    if (!isIncomingMessage(message)) return;

    switch (message.type) {
      case "embedded_auth":
        const messageData = message.data;
        const { authType, authStatus } = messageData;

        this.authInfo = messageData;

        if (authStatus === "not-authenticated") {
          localStorage.removeItem(WanderConnect.AUTH_STATE_LS_KEY);
        } else {
          try {
            localStorage.setItem(WanderConnect.AUTH_STATE_LS_KEY, JSON.stringify(messageData));
          } catch (err) {
            console.warn("Error storing last authentication state:", err);
          }
        }

        if (authType === "NATIVE_WALLET") {
          this.isBrowserWalletEnabled = true;
          localStorage.setItem(WanderConnect.BROWSER_WALLET_ENABLED_KEY, "true");

          // If the user selected using the native wallet, we close the modal and swap the injected API back:
          this._close();
          this.restoreBrowserWalletAPI();
        } else {
          if (authType) {
            this.isBrowserWalletEnabled = false;
            localStorage.removeItem(WanderConnect.BROWSER_WALLET_ENABLED_KEY);
          }

          // Check that the injected wallet is Wander Connect (as it should), or inject it again as soon as possible.
          // This could happen when, for example, the last used option was "NATIVE_WALLET", so the Wander Connect API
          // wasn't injected yet, and the user now selects an authentication method to use Wander Connect.
          this.injectWanderConnectWalletAPI(this.iframeRef);

          if (authStatus === "authenticated") {
            this.dispatchWalletLoadedEvents();
          }

          // Update button for all authentication changes:
          this.buttonComponent?.setVariant(authStatus);

          if (authStatus === "not-authenticated") {
            this.isWalletReady = false;
            this.buttonComponent?.unsetStatus("isConnected");
          }

          if (authStatus === "loading") {
            // TODO: Show spinner instead of iframe.
          } else {
            // TODO: Show iframe
          }
        }

        if (this.isBrowserWalletEnabled) {
          this.onAuth({
            authType: "NATIVE_WALLET",
            authStatus: null,
            userDetails: null,
          });
        } else {
          this.onAuth(messageData);
        }

        break;

      case "embedded_open":
        this._open("embedded_open");
        break;

      case "embedded_close":
        this._close();
        break;

      case "embedded_resize":
        const routeConfig = message.data;

        this.iframeComponent?.resize(routeConfig);

        this.onResize(routeConfig);

        break;

      case "embedded_balance":
        const balanceInfo = message.data;
        this.balanceInfo = balanceInfo;

        this.buttonComponent?.setBalance(balanceInfo);

        this.onBalance(balanceInfo);
        break;

      case "embedded_request":
        // Scenarios to test:
        //
        // - App closed. New request comes in. It opens. It closes when handled.
        // - App opened. New request comes in. Already opened. It doesn't close when handled.
        // - App opened, then closed. New request comes in. It opens. It closes when handled.
        // - App opened. New request comes in. Already opened. App closed. New request comes in. App doesn't open. It doesn't close when handled.
        // - Same as above but with Connect request, App opens automatically.
        // - App closed. New request comes in. It opens. App closed. New request comes in. App doesn't open. It closes when handled.

        const { pendingRequests, hasNewConnectRequest } = message.data;

        this.pendingRequests = pendingRequests;

        if (pendingRequests > 0 && (this.shouldOpenAutomatically || hasNewConnectRequest)) {
          this._open("embedded_request");
        } else if (pendingRequests === 0 && this.shouldCloseAutomatically) {
          // TODO: Re-implement the wait-before-closing feature for both BE and Embed and also use it here:
          this._close(true);
        }

        this.buttonComponent?.setNotifications(pendingRequests);

        this.onRequest(message.data);
        break;
    }
  }

  private handleButtonClick() {
    if (this.isOpen) this.close();
    else this.open();
  }

  private _open(openReason: OpenReason): void {
    if (!this.iframeComponent && !this.buttonComponent) {
      console.warn("Wander Embedded's iframe and button has been created manually");
    }

    if (!this.isOpen) {
      // We only keep the first non-null value and don't updated it until it is reset back to null:
      this.openReason ??= openReason;
      this.buttonComponent?.setStatus("isOpen");
      this.iframeComponent?.show();
    }

    this.onOpen();
  }

  /**
   * Opens the wallet interface
   *
   * @throws Error if Wander Embedded's iframe and button has been created manually
   */
  public open(): void {
    this._open("manually");
  }

  private _close(allowOpeningAutomatically = false): void {
    if (!this.iframeComponent && !this.buttonComponent) {
      console.warn("Wander Embedded's iframe and button has been created manually");
    }

    if (this.isOpen) {
      this.openReason = null;
      this.allowOpeningAutomatically = this.pendingRequests === 0 ? true : allowOpeningAutomatically;
      this.buttonComponent?.unsetStatus("isOpen");
      this.iframeComponent?.hide();
    }

    this.onClose();
  }

  /**
   * Closes the wallet interface
   *
   * @throws Error if Wander Embedded's iframe and button has been created manually
   */
  public close(): void {
    this._close();
  }

  /**
   * Removes all elements and event listeners
   */
  public destroy(): void {
    window.removeEventListener("message", this.handleMessage);
    window.removeEventListener("click", this.handleButtonClick);

    // Remove the elements we crated:

    if (this.iframeComponent) {
      this.iframeComponent.destroy();
    }

    if (this.buttonComponent) {
      this.buttonComponent.destroy();
    }

    WanderConnect.instance = null;

    delete window.arweaveWallet;

    if (this.windowArweaveWallet) {
      window.arweaveWallet = this.windowArweaveWallet;
    }
  }

  /**
   * Indicates whether the wallet interface is currently open/visible
   */
  get isOpen() {
    return this.openReason !== null;
  }

  private get shouldOpenAutomatically() {
    // If the modal is closed and a new AuthRequest comes in, it should also close automatically:
    return this.openReason === null && this.allowOpeningAutomatically;
  }

  private get shouldCloseAutomatically() {
    // If the modal was opened by an AuthRequest, it should close automatically when they are all handled. Otherwise, if
    // it was opened by the user, it should not close automatically:
    return this.openReason === "embedded_request";
  }

  /**
   * Current width of the wallet interface in pixels
   * @returns Width if available
   */
  get width(): number | undefined {
    return this.routeConfig?.width;
  }

  /**
   * Current height of the wallet interface in pixels
   * @returns Height if available
   */
  get height(): number | undefined {
    return this.routeConfig?.height;
  }
}
