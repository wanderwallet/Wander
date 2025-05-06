import {
  ImgPath,
  isRouteConfig,
  LayoutConfig,
  LayoutType,
  RouteConfig,
  RouteType,
  WanderEmbeddedIframeConfig,
  WanderEmbeddedIframeOptions,
  WanderEmbeddedIframeCSSVars,
} from "../../wander-embedded.types";
import { addCSSVariables, mergeCSSVariablesOption } from "../../utils/styles/styles.utils";
import { getWanderIframeTemplateContent } from "./wander-iframe.template";

export class WanderIframe {
  static DEFAULT_LIGHT_CSS_VARS: WanderEmbeddedIframeCSSVars = {
    // Iframe Wrapper (div.iframe-wrapper)
    background: "white",
    borderWidth: 2,
    borderColor: "rgba(0, 0, 0, .125)",
    borderRadius: 10,
    boxShadow: "0 0 16px 0 rgba(0, 0, 0, 0.125)",
    zIndex: "9999",
    preferredWidth: 400,
    preferredHeight: 400,

    // Iframe Content:
    contentPadding: 0,
    contentMaxWidth: 600,
    contentMaxHeight: "100dvh",

    // Backdrop (div):
    backdropBackground: "rgba(255, 255, 255, .0625)",
    backdropBackdropFilter: "blur(12px)",
    backdropPadding: 8,

    // Mobile-specific:
    mobilePadding: 0,
    mobileHeight: 0,
    mobileBorderRadius: 0,
    mobileBorderWidth: 0,
    mobileBorderColor: "transparent",
    mobileBoxShadow: "none",
  } as const;

  static DEFAULT_DARK_CSS_VARS: WanderEmbeddedIframeCSSVars = {
    ...WanderIframe.DEFAULT_LIGHT_CSS_VARS,
    background: "black",
  } as const;

  static DEFAULT_CONFIG = {
    id: "wanderEmbeddedIframeHost",
    theme: "system",
    cssVars: {
      light: WanderIframe.DEFAULT_LIGHT_CSS_VARS,
      dark: WanderIframe.DEFAULT_DARK_CSS_VARS,
    },
    customStyles: "",
    routeLayout: {
      default: WanderIframe.getLayoutConfig("popup"),
      auth: WanderIframe.getLayoutConfig("modal"),
      account: WanderIframe.getLayoutConfig("modal"),
      settings: WanderIframe.getLayoutConfig("popup"),
      "auth-request": WanderIframe.getLayoutConfig("popup"),
    },
    clickOutsideBehavior: true,
  } as const satisfies WanderEmbeddedIframeConfig;

  static readonly IMAGE_EXTENSIONS = ["png", "webp"] as const;
  static readonly DEFAULT_ROUTE_TYPES: readonly RouteType[] = [
    "default",
    "auth",
    "account",
    "auth-request",
    "settings",
  ];
  static readonly ALLOWED_IMG_PATHS: ReadonlySet<ImgPath> = new Set(
    WanderIframe.DEFAULT_ROUTE_TYPES.flatMap((route) =>
      WanderIframe.IMAGE_EXTENSIONS.map((ext) => `${route}.${ext}` as ImgPath),
    ),
  );

  // Elements:
  private host: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private iframe: HTMLIFrameElement;
  private halfImage: HTMLImageElement;

  // Config (options):
  private config: WanderEmbeddedIframeConfig;

  // State:
  private currentLayoutType: LayoutType | null = null;
  private isOpen = false;

  private imageBaseUrl: string | null = null;

  constructor(src: string, options: WanderEmbeddedIframeOptions = {}) {
    const cssVars = mergeCSSVariablesOption(
      options.cssVars,
      options.theme,
      WanderIframe.DEFAULT_LIGHT_CSS_VARS,
      WanderIframe.DEFAULT_DARK_CSS_VARS,
    );

    const routeLayoutOption = options.routeLayout;

    let routeLayout: null | Record<RouteType, LayoutConfig> = null;

    if (typeof routeLayoutOption === "string" || isRouteConfig(routeLayoutOption)) {
      // If a single value is passed, we use it for "default", "settings" and "auth-request" routes. "auth" and
      // "account" routes fall back to the default layout type (currently "modal"):

      const defaultLayoutConfig = WanderIframe.getLayoutConfig(routeLayoutOption);

      routeLayout = {
        default: defaultLayoutConfig,
        auth: WanderIframe.DEFAULT_CONFIG.routeLayout.auth,
        account: WanderIframe.DEFAULT_CONFIG.routeLayout.auth,
        settings: defaultLayoutConfig,
        "auth-request": defaultLayoutConfig,
      };
    } else {
      // If more than one value is set, the "default" option will be used for "default" routes as well as as fallback
      // for "settings" and "auth-request" routes; the "auth" option will be used for "auth" routes as well as as
      // fallback for "account" routes:

      const defaultLayoutConfig = routeLayoutOption?.default
        ? WanderIframe.getLayoutConfig(routeLayoutOption?.default)
        : WanderIframe.DEFAULT_CONFIG.routeLayout.default;

      const authLayoutConfig = routeLayoutOption?.auth
        ? WanderIframe.getLayoutConfig(routeLayoutOption?.auth)
        : WanderIframe.DEFAULT_CONFIG.routeLayout.auth;

      routeLayout = {
        default: defaultLayoutConfig,
        auth: authLayoutConfig,
        account: routeLayoutOption?.account
          ? WanderIframe.getLayoutConfig(routeLayoutOption.account)
          : authLayoutConfig,
        settings: routeLayoutOption?.settings
          ? WanderIframe.getLayoutConfig(routeLayoutOption.settings)
          : defaultLayoutConfig,
        "auth-request": routeLayoutOption?.["auth-request"]
          ? WanderIframe.getLayoutConfig(routeLayoutOption["auth-request"])
          : defaultLayoutConfig,
      };
    }

    this.config = {
      id: options.id || WanderIframe.DEFAULT_CONFIG.id,
      theme: options.theme || WanderIframe.DEFAULT_CONFIG.theme,
      cssVars,
      customStyles: options.customStyles || WanderIframe.DEFAULT_CONFIG.customStyles,
      routeLayout,
      clickOutsideBehavior: options.clickOutsideBehavior || WanderIframe.DEFAULT_CONFIG.clickOutsideBehavior,
    };

    this.imageBaseUrl = new URL(src).origin;

    const elements = WanderIframe.initializeIframe(src, this.config);

    this.host = elements.host;
    this.backdrop = elements.backdrop;
    this.wrapper = elements.wrapper;
    this.iframe = elements.iframe;
    this.halfImage = elements.halfImage;

    // Apply initial styling:

    this.resize({
      routeType: "auth",
      preferredLayoutType: routeLayout.auth.type,
      height: 0,
    });
  }

  private getRouteImageUrl(imgPath: string): string | null {
    if (!imgPath || !WanderIframe.ALLOWED_IMG_PATHS.has(imgPath as ImgPath)) {
      return null;
    }

    return `${this.imageBaseUrl}/assets/routes/${imgPath}`;
  }

  static getLayoutConfig(layoutConfig: LayoutConfig | LayoutType): LayoutConfig {
    return typeof layoutConfig === "object"
      ? layoutConfig
      : ({
          type: layoutConfig,
        } satisfies LayoutConfig);
  }

  static initializeIframe(src: string, config: WanderEmbeddedIframeConfig) {
    // TODO: Considering using a `<dialog>` element or adding proper aria- tags.
    const host = document.createElement("div");

    host.id = config.id;

    const shadow = host.attachShadow({ mode: "open" });
    const template = document.createElement("template");

    template.innerHTML = getWanderIframeTemplateContent({
      customStyles: config.customStyles,
      // TODO: It would be better to create an interface with the subset of vars that we can override when changing themes:
      cssVariableKeys: Object.keys(WanderIframe.DEFAULT_LIGHT_CSS_VARS),
    });

    shadow.appendChild(template.content);

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";

    const wrapper = document.createElement("div");
    wrapper.className = "iframe-wrapper";

    const iframe = document.createElement("iframe");
    iframe.className = "iframe";
    iframe.src = src;

    wrapper.appendChild(iframe);

    const halfImage = document.createElement("img");
    halfImage.className = "half-image";

    // We don't add the iframe as a child of backdrop to have more control over the hide/show transitions:
    shadow.appendChild(wrapper);
    shadow.appendChild(backdrop);
    shadow.appendChild(halfImage);

    return {
      iframe,
      host,
      backdrop,
      wrapper,
      halfImage,
    };
  }

  getElements() {
    return {
      host: this.host,
      backdrop: this.backdrop,
      wrapper: this.wrapper,
      iframe: this.iframe,
      halfImage: this.halfImage,
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
    const { config, wrapper } = this;
    const layoutConfig = config.routeLayout[routeConfig.routeType];
    const layoutType = layoutConfig.type;

    this.currentLayoutType = layoutType;

    // Reset image visibility when switching layouts
    if (layoutType !== "half") {
      this.halfImage.style.display = "none";
      this.halfImage.classList.remove("show");
    }

    // TODO: if (this.currentLayoutType !== layoutType) { ... }

    wrapper.dataset.layout = layoutType;
    wrapper.dataset.position = "";
    wrapper.dataset.expanded = "";

    // TODO: Default to true, unless explicitly set to false, false is WIP
    wrapper.dataset.expandOnMobile = layoutConfig.expandOnMobile !== false ? "true" : "false";

    const layoutCssVarsUpdates: Partial<WanderEmbeddedIframeCSSVars> = {};

    switch (layoutConfig.type) {
      case "modal": {
        // Modal resizes to fit content (unless fixed-size provided):
        layoutCssVarsUpdates.preferredWidth = layoutConfig.fixedWidth || routeConfig.width || "";
        layoutCssVarsUpdates.preferredHeight = layoutConfig.fixedHeight || routeConfig.height || "";
        break;
      }

      case "popup": {
        wrapper.dataset.position = layoutConfig.position || "bottom-right";

        // Popup resizes to fit content (unless fixed-size provided):
        layoutCssVarsUpdates.preferredWidth = layoutConfig.fixedWidth || routeConfig.width || "";
        layoutCssVarsUpdates.preferredHeight = layoutConfig.fixedHeight || routeConfig.height || "";
        break;
      }

      case "sidebar": {
        wrapper.dataset.position = layoutConfig.position || "right";
        wrapper.dataset.expanded = layoutConfig.expanded ? "true" : "false";

        if (layoutConfig.expanded) layoutCssVarsUpdates.backdropPadding = 0;

        layoutCssVarsUpdates.preferredWidth = layoutConfig.fixedWidth || routeConfig.width || "";
        layoutCssVarsUpdates.preferredHeight = "calc(100dvh - 2 * var(--backdropPadding, 0))";

        break;
      }

      case "half": {
        const position = (wrapper.dataset.position = layoutConfig.position || "right");
        wrapper.dataset.expanded = layoutConfig.expanded ? "true" : "false";

        if (layoutConfig.expanded) layoutCssVarsUpdates.backdropPadding = 0;

        layoutCssVarsUpdates.preferredWidth = "calc(50vw - 2 * var(--backdropPadding, 0))";
        layoutCssVarsUpdates.preferredHeight = "calc(100dvh - 2 * var(--backdropPadding, 0))";

        // TODO: Fix sidebar flying over the screen when initialized.
        // TODO: Make the image work for the sidebar too?
        // TODO: iframe.show + backdrop
        // TODO: iframe.show ~ .half-image
        // TODO: Do this with selectors alone:
        // Handle imgSrc for half layout
        this.halfImage.dataset.position = position === "left" ? "right" : "left";
        this.halfImage.dataset.expanded = layoutConfig.expanded ? "true" : "false";

        // Get the image url based on the route type
        const imgSrc = this.getRouteImageUrl(`${routeConfig.routeType}.png`);

        if (this.isOpen && imgSrc) {
          this.halfImage.src = imgSrc;
          this.halfImage.style.display = "block";
          this.halfImage.classList.add("show");
        } else {
          this.halfImage.style.display = "none";
          this.halfImage.classList.remove("show");
        }

        break;
      }
    }

    // Every time we change the layout type (e.g. going from the auth routes "modal" to the default routes "popup"), the
    // style attribute must be reset to avoid conflicts with leftover properties from the previous layout

    this.host.removeAttribute("style");

    addCSSVariables(this.host, { ...config.cssVars.light, ...layoutCssVarsUpdates }, "Light");

    addCSSVariables(this.host, { ...config.cssVars.dark, ...layoutCssVarsUpdates }, "Dark");
  }

  destroy() {
    this.host?.remove();
  }
}
