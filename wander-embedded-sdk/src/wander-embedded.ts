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
  IncomingResizeMessageData,
  UserDetails
} from "./utils/message/message.types";
import { isIncomingMessage } from "./utils/message/message.utils";
import { getEmbeddedURL } from "./utils/url/url.utils";

const NOOP = () => {};

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
  private onRequest: (pendingRequests: number) => void = NOOP;

  // Components:
  private buttonComponent: null | WanderButton = null;
  private iframeComponent: null | WanderIframe = null;

  // HTML elements:
  private buttonHostRef: null | HTMLDivElement = null;
  private buttonRef: null | HTMLButtonElement = null;
  private backdropRef: null | HTMLDivElement = null;
  private iframeRef: null | HTMLIFrameElement = null;

  // State:
  private shouldOpenAutomatically = true;

  public isOpen = false;
  public userDetails: UserDetails | null = null; // TODO: Should we expose this?
  public routeConfig: RouteConfig | null = null;
  public balanceInfo: BalanceInfo | null = null;
  public pendingRequests: number = 0;

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
          clickOutsideBehavior: "auto"
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

    console.log("setupEmbeddedWalletSDK() OUT 2");

    // ...and set `window.arweaveWallet`:
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

      const { host, button } = this.buttonComponent.getElements();

      this.buttonHostRef = host;
      this.buttonRef = button;

      document.body.appendChild(host);

      this.handleButtonClick = this.handleButtonClick.bind(this);
      this.buttonRef.addEventListener("click", this.handleButtonClick);
    }

    const clickOutsideBehavior =
      iframeOptions instanceof HTMLElement
        ? false
        : iframeOptions?.clickOutsideBehavior;

    if (clickOutsideBehavior) {
      document.body.addEventListener("click", ({ target }) => {
        // Do not check if `target` is the backdrop <div> as it might have pointer-events: none.

        const shouldClose =
          clickOutsideBehavior === true ||
          (this.iframeRef !== target &&
            this.buttonHostRef !== target &&
            !this.iframeRef?.contains(target as HTMLElement) &&
            !this.buttonHostRef?.contains(target as HTMLElement) &&
            this.backdropRef &&
            (getComputedStyle(this.backdropRef).backdropFilter !== "none" ||
              // TODO: This is not a good way to check if it's totally transparent:
              getComputedStyle(this.backdropRef).background !== "transparent"));

        if (shouldClose) this.close();
      });
    }

    if (this.iframeComponent) {
      document.body.appendChild(this.iframeComponent.getElements().host);
    }
  }

  private handleMessage(event: MessageEvent): void {
    const message = event.data;

    if (!isIncomingMessage(message)) return;

    console.log("MESSAGE", message);

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

      case "embedded_open":
        if (!this.isOpen) {
          this.isOpen = true;

          this.buttonComponent?.setStatus("isOpen");
          this.iframeComponent?.show();
          this.onOpen();
        }
        break;

      case "embedded_close":
        if (this.isOpen) {
          this.isOpen = false;

          this.buttonComponent?.unsetStatus("isOpen");
          this.iframeComponent?.hide();
          this.onClose();
        }
        break;

      case "embedded_resize":
        const routeConfig = message.data;

        this.iframeComponent?.resize(routeConfig);

        this.onResize(routeConfig);

        if (
          routeConfig.routeType === "auth-request" &&
          this.shouldOpenAutomatically &&
          !this.isOpen
        ) {
          this.isOpen = true;
          this.buttonComponent?.setStatus("isOpen");
          this.iframeComponent?.show();
          this.onOpen();
        }

        break;

      case "embedded_balance":
        const balanceInfo = message.data;
        this.balanceInfo = balanceInfo;

        this.buttonComponent?.setBalance(balanceInfo);

        this.onBalance(balanceInfo);
        break;

      case "embedded_request":
        const { pendingRequests } = message.data;
        this.pendingRequests = pendingRequests;

        this.buttonComponent?.setNotifications(pendingRequests);

        this.onRequest(pendingRequests);
        break;
    }
  }

  private handleButtonClick() {
    if (this.isOpen) this.close();
    else this.open();
  }

  public open(): void {
    if (!this.iframeComponent && !this.buttonComponent) {
      throw new Error(
        "Wander Embedded's iframe and button has been created manually"
      );
    }

    if (this.iframeComponent && !this.isOpen) {
      this.isOpen = true;
      this.buttonComponent?.setStatus("isOpen");
      this.iframeComponent.show();
    }
  }

  public close(): void {
    if (!this.iframeComponent && !this.buttonComponent) {
      throw new Error(
        "Wander Embedded's iframe and button has been created manually"
      );
    }

    if (this.iframeComponent && this.isOpen) {
      this.isOpen = false;
      this.buttonComponent?.unsetStatus("isOpen");
      this.iframeComponent.hide();

      // Manually closing the popup while there are pending requests will prevent it from automatically opening again:
      if (this.pendingRequests > 0) {
        this.shouldOpenAutomatically = false;
      }
    }
  }

  public destroy(): void {
    window.removeEventListener("message", this.handleMessage);
    window.removeEventListener("click", this.handleButtonClick);

    // Remove the elements we crated:

    if (this.iframeComponent) {
      this.backdropRef?.remove();
      this.iframeRef?.remove();
    }

    if (this.buttonComponent) {
      this.buttonHostRef?.remove();
      this.buttonRef?.remove();
    }
    WanderEmbedded.instance = null;
  }

  get isAuthenticated() {
    return !!this.userDetails;
  }

  get width() {
    return this.routeConfig?.width;
  }

  get height() {
    return this.routeConfig?.height;
  }
}
