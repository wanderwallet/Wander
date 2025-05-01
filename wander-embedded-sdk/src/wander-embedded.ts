import { setupEmbeddedWalletSDK } from "wallet-api/wallet-sdk.es.js";
import { WanderButton } from "./components/button/wander-button.component";
import { WanderIframe } from "./components/iframe/wander-iframe.component";
import { merge } from "ts-deepmerge";
import {
  AuthState,
  BalanceInfo,
  RouteConfig,
  ThemeSetting,
  WanderEmbeddedOptions
} from "./wander-embedded.types";
import {
  IncomingAuthMessageData,
  IncomingBalanceMessageData,
  IncomingRequestMessageData,
  IncomingResizeMessageData
} from "./utils/message/message.types";
import {
  isEventMessage,
  isIncomingMessage,
  isWalletSwitchMessage
} from "./utils/message/message.utils";
import { getEmbeddedURL } from "./utils/url/url.utils";

const NOOP = () => {};

type OpenReason = "manually" | "embedded_open" | "embedded_request";

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
export class WanderEmbedded {
  private static instance: WanderEmbedded | null = null;

  static AUTH_STATE_LS_KEY = "WANDER_CONNECT_AUTH_STATE" as const;

  static DEFAULT_IFRAME_SRC =
    process.env.NODE_ENV === "development"
      ? ("http://localhost:5173/" as const)
      : ("https://embed-dev.wander.app/" as const);

  static DEFAULT_THEME = "system" as const satisfies ThemeSetting;

  // Callbacks:
  private onAuth: (authState: AuthState) => void = NOOP;
  private onOpen: () => void = NOOP;
  private onClose: () => void = NOOP;
  private onResize: (routeConfig: RouteConfig) => void = NOOP;
  private onBalance: (balanceInfo: BalanceInfo) => void = NOOP;
  private onRequest: (data: IncomingRequestMessageData) => void = NOOP;

  // Components:
  private buttonComponent: null | WanderButton = null;
  private iframeComponent: null | WanderIframe = null;

  // HTML elements:
  private buttonHostRef: null | HTMLDivElement = null;
  private buttonRef: null | HTMLButtonElement = null;
  private backdropRef: null | HTMLDivElement = null;
  private iframeRef: null | HTMLIFrameElement = null;

  // State:
  private openReason: OpenReason | null = null;
  private allowOpeningAutomatically = true;

  /**
   * Contains the current authentication state of the SDK, and it is initialized with cached data in order to show as
   * soon as possible the non-auth or the loading auth version of the SDK.
   */
  public authenticationState: AuthState = {
    authType: null,
    authStatus: "not-authenticated",
    userDetails: null
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

  // Misc.:
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
  constructor(options: WanderEmbeddedOptions) {
    if (WanderEmbedded.instance) {
      throw new Error("WanderEmbedded instance already exists.");
    }

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
          clickOutsideBehavior: true
        },
        button: true
      } satisfies WanderEmbeddedOptions,
      options || {}
    );

    if (!optionsWithDefaults.clientId) throw new Error("clientId is required");

    try {
      const authState = JSON.parse(
        localStorage.getItem(WanderEmbedded.AUTH_STATE_LS_KEY) || "null"
      );

      if (authState) {
        // We initialize it as "loading" as we cannot still trust the cached data. The session still needs to be verified:
        this.authenticationState = {
          authType: authState.authType,
          authStatus: "loading",
          userDetails: authState.userDetails
        };
      }
    } catch (err) {
      console.warn("Error parsing last authentication state:", err);
    }

    // Create or get references to iframe and, maybe, button:
    this.initializeComponents(optionsWithDefaults);

    if (!this.iframeRef) throw new Error("Error creating iframe");

    // Once we have all the elements in place, start listening for wallet messages...
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage);

    if (window.arweaveWallet.walletName !== "Wander Embedded") {
      // ...we get a reference to any other `window.arweaveWallet` (most likely our BE)...:
      this.windowArweaveWallet = window.arweaveWallet;
    }

    if (this.authenticationState.authType !== "NATIVE_WALLET") {
      // ...and (re)set `window.arweaveWallet`, unless the user has previously selected using the native wallet:
      setupEmbeddedWalletSDK(this.iframeRef);
    }
  }

  private initializeComponents(options: WanderEmbeddedOptions): void {
    const {
      clientId,
      baseURL = WanderEmbedded.DEFAULT_IFRAME_SRC,
      theme = WanderEmbedded.DEFAULT_THEME,
      hideBE,
      baseServerURL,
      iframe: iframeOptions,
      button: buttonOptions
    } = options;

    const srcWithParams = getEmbeddedURL({
      baseURL,
      clientId,
      theme,
      hideBE,
      baseServerURL
    });

    if (iframeOptions instanceof HTMLElement) {
      if (iframeOptions.src && iframeOptions.src !== srcWithParams) {
        console.warn(
          `Replacing iframe.src ("${iframeOptions.src}") with ${srcWithParams}`
        );
      }

      iframeOptions.src = srcWithParams;

      this.iframeRef = iframeOptions;
    } else {
      this.iframeComponent = new WanderIframe(srcWithParams, iframeOptions);

      const elements = this.iframeComponent.getElements();

      this.backdropRef = elements.backdrop;
      this.iframeRef = elements.iframe;
    }

    if (typeof buttonOptions === "object" || buttonOptions === true) {
      this.buttonComponent = new WanderButton(
        buttonOptions === true ? {} : buttonOptions
      );

      this.buttonComponent.setVariant(
        this.authenticationState.authStatus || "not-authenticated"
      );

      const { parent, host, button } = this.buttonComponent.getElements();

      this.buttonHostRef = host;
      this.buttonRef = button;

      parent.appendChild(host);

      this.handleButtonClick = this.handleButtonClick.bind(this);
      this.buttonRef.addEventListener("click", this.handleButtonClick);
    }

    const clickOutsideBehavior =
      iframeOptions instanceof HTMLElement
        ? false
        : iframeOptions?.clickOutsideBehavior;

    if (clickOutsideBehavior && this.backdropRef) {
      this.backdropRef.addEventListener("click", () => {
        this.close();
      });
    }

    if (this.iframeComponent) {
      document.body.appendChild(this.iframeComponent.getElements().host);
    }
  }

  private handleMessage(event: MessageEvent): void {
    const message = event.data;

    if (!this.iframeRef || event.origin !== new URL(this.iframeRef.src).origin)
      return;

    console.log("MESSAGE =", event.data.type, event.data);

    if (isEventMessage(message)) {
      const events = window.arweaveWallet?.events;

      if (events) events.emit(message.data.name, message.data.value);

      return;
    }

    if (isWalletSwitchMessage(message)) {
      // dispatch custom event
      dispatchEvent(
        new CustomEvent("walletSwitch", {
          detail: { address: message.data }
        })
      );

      return;
    }

    // TODO: Handle switch_wallet_event

    if (!isIncomingMessage(message)) return;

    switch (message.type) {
      case "embedded_auth":
        const { authType, authStatus } = message.data;

        if (authStatus === "not-authenticated") {
          localStorage.removeItem(WanderEmbedded.AUTH_STATE_LS_KEY);
        } else {
          try {
            localStorage.setItem(
              WanderEmbedded.AUTH_STATE_LS_KEY,
              JSON.stringify(message.data)
            );
          } catch (err) {
            console.warn("Error storing last authentication state:", err);
          }

          this.authenticationState = message.data;
        }

        if (authType === "NATIVE_WALLET") {
          this._close();

          if (window.arweaveWallet.walletName === "Wander Embedded") {
            // If the user selected using the native wallet, we swap the injected API back to what it was:
            window.arweaveWallet = this.windowArweaveWallet;
          }
        } else {
          if (
            authStatus !== "not-authenticated" &&
            window.arweaveWallet.walletName !== "Wander Embedded"
          ) {
            // If the user authenticates and the injected wallet API is not Wander Connect yet, we inject it now:
            setupEmbeddedWalletSDK(this.iframeRef);
          }

          this.buttonComponent?.setVariant(authStatus);

          if (authStatus === "loading") {
            // TODO: Show spinner instead of iframe.
          } else {
            // TODO: Show iframe
          }
        }

        this.onAuth(message.data);

        break;

      case "embedded_connect":
        this.buttonComponent?.setStatus("isConnected");
        break;

      case "embedded_disconnect":
        this.buttonComponent?.unsetStatus("isConnected");
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

        if (
          pendingRequests > 0 &&
          (this.shouldOpenAutomatically || hasNewConnectRequest)
        ) {
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
      console.warn(
        "Wander Embedded's iframe and button has been created manually"
      );
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
      console.warn(
        "Wander Embedded's iframe and button has been created manually"
      );
    }

    if (this.isOpen) {
      this.openReason = null;
      this.allowOpeningAutomatically =
        this.pendingRequests === 0 ? true : allowOpeningAutomatically;
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

    WanderEmbedded.instance = null;

    delete window.arweaveWallet;

    if (this.windowArweaveWallet) {
      window.arweaveWallet = this.windowArweaveWallet;
    }
  }

  // TODO: Remove, as authenticationState is public?
  /**
   * Whether a user is currently authenticated
   * @returns True if authenticated, false otherwise
   */
  get isAuthenticated(): boolean {
    return (
      this.authenticationState.authStatus === "authenticated" &&
      !!this.authenticationState.userDetails
    );
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
