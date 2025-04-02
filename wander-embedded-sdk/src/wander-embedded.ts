import { setupEmbeddedWalletSDK } from "wallet-api/wallet-sdk.es.js";
import { WanderButton } from "./components/button/wander-button.component";
import { WanderIframe } from "./components/iframe/wander-iframe.component";
import { merge } from "ts-deepmerge";
import {
  BalanceInfo,
  RouteConfig,
  WanderEmbeddedOptions
} from "./wander-embedded.types";
import {
  IncomingBalanceMessageData,
  IncomingRequestMessageData,
  IncomingResizeMessageData,
  UserDetails
} from "./utils/message/message.types";
import { isIncomingMessage } from "./utils/message/message.utils";
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

  static DEFAULT_IFRAME_SRC =
    process.env.NODE_ENV === "development"
      ? ("http://localhost:5173/" as const)
      : ("https://embed-dev.wander.app/" as const);

  // Callbacks:
  private onAuth: (userDetails: UserDetails | null) => void = NOOP;
  private onOpen: () => void = NOOP;
  private onClose: () => void = NOOP;
  private onResize: (data: IncomingResizeMessageData) => void = NOOP;
  private onBalance: (data: IncomingBalanceMessageData) => void = NOOP;
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
   * Contains details about the authenticated user, or null if not authenticated
   */
  public userDetails: UserDetails | null = null; // TODO: Should we expose this?

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

    // Create or get references to iframe and, maybe, button:
    this.initializeComponents(optionsWithDefaults);

    if (!this.iframeRef) throw new Error("Error creating iframe");

    // TODO: Pass theme, balance config and max width/height to iframe context:
    // this.iframeRef.contentWindow.postMessage(message, "*");

    // Once we have all the elements in place, start listening for wallet messages...
    this.handleMessage = this.handleMessage.bind(this);
    window.addEventListener("message", this.handleMessage);

    // ...we get a reference to any other `window.arweaveWallet` (most likely our BE)...:
    this.windowArweaveWallet = window.arweaveWallet;

    // ...and (re)set `window.arweaveWallet`:
    setupEmbeddedWalletSDK(this.iframeRef);
  }

  private initializeComponents(options: WanderEmbeddedOptions): void {
    const {
      clientId,
      baseURL = WanderEmbedded.DEFAULT_IFRAME_SRC,
      baseServerURL,
      iframe: iframeOptions,
      button: buttonOptions
    } = options;

    const srcWithParams = getEmbeddedURL({
      clientId,
      baseURL,
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

      // document.body.appendChild(elements.backdrop);
      // document.body.appendChild(elements.iframe);
    }

    if (typeof buttonOptions === "object" || buttonOptions === true) {
      this.buttonComponent = new WanderButton(
        buttonOptions === true ? {} : buttonOptions
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

    if (!isIncomingMessage(message)) return;

    console.log("SDK GOT MESSAGE", message);

    switch (message.type) {
      case "embedded_auth":
        const { userDetails } = message.data;
        this.userDetails = userDetails;

        if (userDetails) {
          this.buttonComponent?.setStatus("isAuthenticated");

          this.iframeComponent?.resize({
            routeType: "default",
            preferredLayoutType: "popup",
            height: 0
          });
        } else {
          this.buttonComponent?.unsetStatus("isAuthenticated");

          this.iframeComponent?.resize({
            routeType: "auth",
            preferredLayoutType: "modal",
            height: 0
          });
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

  /**
   * Whether a user is currently authenticated
   * @returns True if authenticated, false otherwise
   */
  get isAuthenticated(): boolean {
    return !!this.userDetails;
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
