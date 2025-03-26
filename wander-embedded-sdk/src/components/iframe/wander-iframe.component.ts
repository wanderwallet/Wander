import { CSSProperties } from "react";
import {
  HalfLayoutConfig,
  isRouteConfig,
  isThemeRecord,
  LayoutConfig,
  LayoutType,
  ModalLayoutConfig,
  PopupLayoutConfig,
  RouteConfig,
  RouteType,
  SidebarLayoutConfig,
  WanderEmbeddedIframeConfig,
  WanderEmbeddedIframeOptions,
  WanderEmbeddedModalCSSVars
} from "../../wander-embedded.types";
import { addCSSVariables } from "../../utils/styles/styles.utils";
import { getWanderIframeTemplateContent } from "./wander-iframe.template";

export class WanderIframe {
  static DEFAULT_BACKDROP_ID = "wanderEmbeddedBackdrop" as const;
  static DEFAULT_IFRAME_ID = "wanderEmbeddedIframe" as const;
  static DEFAULT_ROUTE_LAYOUT = {
    modal: {
      type: "modal"
    } as ModalLayoutConfig,
    popup: {
      type: "popup"
    } as PopupLayoutConfig,
    sidebar: {
      type: "sidebar"
    } as SidebarLayoutConfig,
    half: {
      type: "half"
    } as HalfLayoutConfig
  };

  // Elements:
  private host: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private iframe: HTMLIFrameElement;

  // Config (options):
  // private config: WanderEmbeddedIframeConfig;
  private options: WanderEmbeddedIframeOptions;
  private routeLayout: Partial<Record<RouteType, LayoutConfig>>;

  // State:
  private currentLayoutType: LayoutType | null = null;
  private isOpen = false;

  constructor(src: string, options: WanderEmbeddedIframeOptions = {}) {
    this.options = options;

    const { routeLayout } = options;

    if (typeof routeLayout === "string" || isRouteConfig(routeLayout)) {
      // If a single value is passed, we use it for default and auth-request. Anything else fallbacks to the default
      // (currently modal):

      const defaultLayoutConfig = WanderIframe.getLayoutConfig(routeLayout);

      this.routeLayout = {
        default: defaultLayoutConfig,
        "auth-request": defaultLayoutConfig
      };
    } else {
      // If only default and auth are defined by the developer, default is used for both default and auth-request, and
      // auth is used for auth, account and settings:

      const defaultLayoutConfig = WanderIframe.getLayoutConfig(
        routeLayout?.default || "popup"
      );

      const authLayoutConfig = WanderIframe.getLayoutConfig(
        routeLayout?.auth || "modal"
      );

      this.routeLayout = {
        default: defaultLayoutConfig,
        auth: authLayoutConfig,
        account:
          WanderIframe.getLayoutConfig(routeLayout?.account) ||
          authLayoutConfig,
        settings:
          WanderIframe.getLayoutConfig(routeLayout?.settings) ||
          authLayoutConfig,
        "auth-request":
          WanderIframe.getLayoutConfig(routeLayout?.["auth-request"]) ||
          defaultLayoutConfig
      };
    }

    const elements = WanderIframe.initializeIframe(src, options);

    this.host = elements.host;
    this.backdrop = elements.backdrop;
    this.iframe = elements.iframe;

    // Apply initial styling:

    this.resize({
      routeType: "auth",
      preferredLayoutType: this.routeLayout.auth?.type || "modal",
      height: 0
    });
  }

  static getLayoutConfig(
    layoutConfig?: LayoutConfig | LayoutType
  ): LayoutConfig | undefined {
    if (!layoutConfig) return undefined;

    return typeof layoutConfig === "object"
      ? layoutConfig
      : WanderIframe.DEFAULT_ROUTE_LAYOUT[layoutConfig];
  }

  static initializeIframe(src: string, options: WanderEmbeddedIframeOptions) {
    // TODO: Considering using a `<dialog>` element or adding proper aria- tags.
    const host = document.createElement("div");
    host.id = options.id || WanderIframe.DEFAULT_IFRAME_ID;

    const shadow = host.attachShadow({ mode: "open" });
    const template = document.createElement("template");

    template.innerHTML = getWanderIframeTemplateContent({ src });

    shadow.appendChild(template.content);

    // Elements from the shadow DOM
    const backdrop = shadow.querySelector(".backdrop") as HTMLDivElement;
    const iframe = shadow.querySelector(".iframe") as HTMLIFrameElement;

    return {
      iframe,
      host,
      backdrop
    };
  }

  getElements() {
    return {
      host: this.host,
      backdrop: this.backdrop,
      iframe: this.iframe
    };
  }

  show(): void {
    this.isOpen = true;
    this.backdrop.classList.add("show");
    this.iframe.classList.add("show");
  }

  hide(): void {
    this.isOpen = false;
    this.backdrop.classList.remove("show");
    this.iframe.classList.remove("show");
  }

  resize(routeConfig: RouteConfig): void {
    const layoutConfig =
      this.routeLayout[routeConfig.routeType] ||
      WanderIframe.DEFAULT_ROUTE_LAYOUT[routeConfig.preferredLayoutType];

    const layoutType: LayoutType = layoutConfig.type;
    const resetLayout = layoutType !== this.currentLayoutType;

    this.currentLayoutType = layoutType;

    this.iframe.dataset.layout = layoutType;

    // Default to true, unless explicitly set to false, false is WIP
    this.iframe.dataset.expandOnMobile =
      layoutConfig.expandOnMobile !== false ? "true" : "false";

    if (this.options.cssVars && isThemeRecord(this.options.cssVars)) {
      throw new Error("Not implemented yet");
    }

    const cssVars: Partial<WanderEmbeddedModalCSSVars> = {
      ...this.options.cssVars
    };

    switch (layoutConfig.type) {
      case "modal": {
        // Modal resizes to fit content:
        cssVars.preferredWidth ??= layoutConfig.fixedWidth || routeConfig.width;
        cssVars.preferredHeight ??=
          layoutConfig.fixedHeight || routeConfig.height;
        break;
      }

      case "popup": {
        const position = layoutConfig.position || "bottom-right";
        this.iframe.dataset.position = position;
        // Popup should not resize to fit content:
        cssVars.preferredWidth ??= layoutConfig.fixedWidth;
        cssVars.preferredHeight ??= layoutConfig.fixedHeight;
        break;
      }

      case "sidebar":
      case "half": {
        const position = layoutConfig.position || "right";
        this.iframe.dataset.position = position;

        if (layoutConfig.expanded) {
          this.iframe.dataset.expanded = "true";
          cssVars.backdropPadding = 0;
          cssVars.borderRadius ??= 0;
        } else {
          this.iframe.dataset.expanded = "false";
          cssVars.backdropPadding ??= 8;
        }

        if (layoutConfig.type === "sidebar") {
          cssVars.preferredWidth ??=
            layoutConfig.fixedWidth || routeConfig.width;
          cssVars.preferredHeight ??=
            "calc(100dvh - 2 * var(--backdropPadding, 0))";
        } else {
          cssVars.preferredWidth ??=
            "calc(50vw - 2 * var(--backdropPadding, 0))";
          cssVars.preferredHeight ??=
            "calc(100dvh - 2 * var(--backdropPadding, 0))";

          // TODO Set imgSrc
        }

        break;
      }
    }

    // Every time we change the layout type (e.g. going from the auth routes "modal" to the default routes "popup"), the
    // style attribute must be reset to avoid conflicts with leftover properties from the previous layout
    if (resetLayout) {
      this.backdrop.removeAttribute("style");
      this.iframe.removeAttribute("style");
    }

    addCSSVariables(this.backdrop, cssVars);
    addCSSVariables(this.iframe, cssVars);
  }
}
