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
  private wrapper: HTMLDivElement;
  private iframe: HTMLIFrameElement;
  private halfImage: HTMLImageElement;

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
    this.wrapper = elements.wrapper;
    this.iframe = elements.iframe;
    this.halfImage = elements.halfImage;

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

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";
    backdrop.id = WanderIframe.DEFAULT_BACKDROP_ID;

    const wrapper = document.createElement("div");
    wrapper.className = "iframe-wrapper";

    const iframe = document.createElement("iframe");
    iframe.className = "iframe";
    iframe.src = src;

    wrapper.appendChild(iframe);

    const halfImage = document.createElement("img");
    halfImage.className = "half-image";

    // We don't add the iframe as a child of backdrop to have more control over the hide/show transitions:
    shadow.appendChild(backdrop);
    shadow.appendChild(halfImage);
    shadow.appendChild(wrapper);

    return {
      iframe,
      host,
      backdrop,
      wrapper,
      halfImage
    };
  }

  getElements() {
    return {
      host: this.host,
      backdrop: this.backdrop,
      wrapper: this.wrapper,
      iframe: this.iframe,
      halfImage: this.halfImage
    };
  }

  show(): void {
    this.isOpen = true;
    this.backdrop.classList.add("show");
    this.wrapper.classList.add("show");

    if (this.currentLayoutType === "half" && this.halfImage.src) {
      this.halfImage.classList.add("show");
    }
  }

  hide(): void {
    this.isOpen = false;
    this.backdrop.classList.remove("show");
    this.wrapper.classList.remove("show");
    this.halfImage.classList.remove("show");
  }

  resize(routeConfig: RouteConfig): void {
    const layoutConfig =
      this.routeLayout[routeConfig.routeType] ||
      WanderIframe.DEFAULT_ROUTE_LAYOUT[routeConfig.preferredLayoutType];

    const layoutType: LayoutType = layoutConfig.type;

    this.currentLayoutType = layoutType;

    this.wrapper.dataset.layout = layoutType;

    // Default to true, unless explicitly set to false, false is WIP
    this.wrapper.dataset.expandOnMobile =
      layoutConfig.expandOnMobile !== false ? "true" : "false";

    if (this.options.cssVars && isThemeRecord(this.options.cssVars)) {
      throw new Error("Not implemented yet");
    }

    const cssVars: Partial<WanderEmbeddedModalCSSVars> = {
      ...this.options.cssVars
    };

    switch (layoutConfig.type) {
      case "modal": {
        cssVars.preferredWidth ??= layoutConfig.fixedWidth || routeConfig.width;
        cssVars.preferredHeight ??=
          layoutConfig.fixedHeight || routeConfig.height;
        break;
      }

      case "popup": {
        const position = layoutConfig.position || "bottom-right";
        this.wrapper.dataset.position = position;

        cssVars.preferredWidth ??= layoutConfig.fixedWidth || routeConfig.width;
        cssVars.preferredHeight ??=
          layoutConfig.fixedHeight || routeConfig.height;
        break;
      }

      case "sidebar":
      case "half": {
        const position = layoutConfig.position || "right";
        this.wrapper.dataset.position = position;

        if (layoutConfig.expanded) {
          this.wrapper.dataset.expanded = "true";
          cssVars.backdropPadding = 0;
          cssVars.borderRadius ??= 0;
        } else {
          this.wrapper.dataset.expanded = "false";
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

          // Handle imgSrc for half layout
          this.halfImage.dataset.position =
            position === "left" ? "right" : "left";
          this.halfImage.dataset.expanded = layoutConfig.expanded
            ? "true"
            : "false";

          // Check for imgSrc in routeConfig first (from iframe message), then fall back to layoutConfig
          const imgSrc = routeConfig.imgSrc || layoutConfig.imgSrc;

          if (imgSrc) {
            if (typeof imgSrc === "string") {
              this.halfImage.src = imgSrc;
              this.halfImage.style.display = "block";
            } else {
              this.halfImage.style.display = "none";
              this.halfImage.classList.remove("show");
            }
          } else {
            this.halfImage.style.display = "none";
            this.halfImage.classList.remove("show");
          }
        }

        break;
      }
    }

    // Every time we change the layout type (e.g. going from the auth routes "modal" to the default routes "popup"), the
    // style attribute must be reset to avoid conflicts with leftover properties from the previous layout

    addCSSVariables(this.backdrop, cssVars);
    addCSSVariables(this.wrapper, cssVars);
  }
}
