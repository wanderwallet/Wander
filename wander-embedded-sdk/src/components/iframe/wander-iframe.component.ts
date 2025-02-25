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

  static BACKDROP_BASE_STYLE: CSSProperties = {
    position: "fixed",
    zIndex: "var(--zIndex, 9999)",
    inset: 0,
    background: "var(--backdropBackground, rgba(255, 255, 255, .0625))",
    backdropFilter: "var(--backdropBackdropFilter, blur(12px))",
    padding: "var(--backdropPadding, 32px)",
    transition: "opacity linear 150ms"
  };

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
  private iframeHideStyle: CSSProperties = {};
  private iframeShowStyle: CSSProperties = {};

  constructor(src: string, options: WanderEmbeddedIframeOptions = {}) {
    this.options = options;

    const { routeLayout } = options;

    if (typeof routeLayout === "string" || isRouteConfig(routeLayout)) {
      // If a single value is passed, we use it for default and auth-requests. Anything else fallbacks to the default
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
        routeLayout?.default
      );
      const authLayoutConfig = WanderIframe.getLayoutConfig(routeLayout?.auth);

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

    template.innerHTML = getWanderIframeTemplateContent({
      mobileConfig: options.mobileConfig
    });

    shadow.appendChild(template.content);

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.id = WanderIframe.DEFAULT_BACKDROP_ID;

    const iframe = document.createElement("iframe");
    iframe.className = "iframe";
    iframe.src = src;

    // We don't add the iframe as a child of backdrop to have more control over the hide/show transitions:
    shadow.appendChild(backdrop);
    shadow.appendChild(iframe);
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

    const backdropStyle: CSSProperties = {};
    const iframeStyle: CSSProperties = {};

    if (this.options.cssVars && isThemeRecord(this.options.cssVars)) {
      throw new Error("Not implemented yet");
    }

    const cssVars: Partial<WanderEmbeddedModalCSSVars> = {
      ...this.options.cssVars
    };

    switch (layoutConfig.type) {
      case "modal": {
        iframeStyle.top = "50%";
        iframeStyle.left = "50%";
        iframeStyle.transform = "translate(-50%, -50%)"; // TODO: Add scale effect when appearing?
        iframeStyle.transition = "opacity linear 150ms";
        cssVars.preferredWidth ??= layoutConfig.fixedWidth || routeConfig.width;
        cssVars.preferredHeight ??=
          layoutConfig.fixedHeight || routeConfig.height;

        break;
      }

      case "popup": {
        const [y, x] = (layoutConfig.position || "bottom-right").split("-") as [
          "top" | "bottom",
          "left" | "right"
        ];

        iframeStyle[y] = "var(--backdropPadding, 32px)";
        iframeStyle[x] = "var(--backdropPadding, 32px)";
        iframeStyle.transition = "opacity linear 150ms";
        // iframeStyle.minWidth = 0;
        // iframeStyle.minHeight = 0;
        cssVars.preferredWidth ??= layoutConfig.fixedWidth || routeConfig.width;
        cssVars.preferredHeight ??=
          layoutConfig.fixedHeight || routeConfig.height;

        break;
      }

      case "sidebar":
      case "half": {
        const y = layoutConfig.position || "right";
        const sign = y === "right" ? "+" : "-";

        iframeStyle.top = layoutConfig.expanded
          ? 0
          : `var(--backdropPadding, 0)`;
        iframeStyle[y] = layoutConfig.expanded
          ? 0
          : `var(--backdropPadding, 0)`;
        iframeStyle.transition = "opacity linear 150ms";

        this.iframeHideStyle = {
          transform: `translate(calc(${sign}100% ${sign} var(--backdropPadding, 32px)), 0)`
        };

        this.iframeShowStyle = {
          transform: `translate(0, 0)`
        };

        if (layoutConfig.expanded) {
          iframeStyle.borderWidth =
            y === "right"
              ? "0 0 0 var(--borderWidth, 2px)"
              : "0 var(--borderWidth, 2px) 0 0";

          iframeStyle.width = "var(--preferredWidth, 400px)";
          iframeStyle.height = "var(--preferredHeight, 600px)";
          iframeStyle.maxWidth = "var(--preferredWidth, 400px)";
          iframeStyle.maxHeight = "var(--preferredHeight, 600px)";

          cssVars.backdropPadding = 0;
          cssVars.borderRadius ??= 0;
        } else {
          cssVars.backdropPadding ??= 8;
        }

        if (layoutConfig.type === "sidebar") {
          cssVars.preferredWidth ??=
            layoutConfig.fixedWidth || routeConfig.width;
          cssVars.preferredHeight ??=
            "calc(100dvw - 2 * var(--backdropPadding, 0))";
        } else {
          cssVars.preferredWidth ??=
            "calc(50vw - 2 * var(--backdropPadding, 0))";
          cssVars.preferredHeight ??=
            "calc(100dvw - 2 * var(--backdropPadding, 0))";

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

      Object.assign(this.backdrop.style, WanderIframe.BACKDROP_BASE_STYLE);
    }

    Object.assign(this.backdrop.style, backdropStyle);

    Object.assign(this.iframe.style, iframeStyle);

    addCSSVariables(this.backdrop, cssVars);
    addCSSVariables(this.iframe, cssVars);
  }
}
