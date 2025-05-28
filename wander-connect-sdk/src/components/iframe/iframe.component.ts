import {
  ImgPath,
  LayoutConfig,
  LayoutType,
  RouteConfig,
  RouteType,
  IframeConfig,
  IframeOptions,
  IframeCSSVars,
} from "../../wander-connect.types";
import { addCSSVariables, mergeCSSVariablesOption } from "../../utils/styles/styles.utils";
import { getIframeTemplateContent } from "./iframe.template";
import { isRouteConfig } from "../../utils/layout/layout.utils";

export class Iframe {
  static DEFAULT_LIGHT_CSS_VARS: IframeCSSVars = {
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

  static DEFAULT_DARK_CSS_VARS: IframeCSSVars = {
    ...Iframe.DEFAULT_LIGHT_CSS_VARS,
    background: "black",
  } as const;

  static DEFAULT_CONFIG = {
    id: "wanderConnectIframeHost",
    theme: "system",
    cssVars: {
      light: Iframe.DEFAULT_LIGHT_CSS_VARS,
      dark: Iframe.DEFAULT_DARK_CSS_VARS,
    },
    customStyles: "",
    routeLayout: {
      default: Iframe.getLayoutConfig("popup"),
      auth: Iframe.getLayoutConfig("modal"),
      account: Iframe.getLayoutConfig("modal"),
      settings: Iframe.getLayoutConfig("popup"),
      "auth-request": Iframe.getLayoutConfig("popup"),
    },
    clickOutsideBehavior: true,
  } as const satisfies IframeConfig;

  static readonly IMAGE_EXTENSIONS = ["png", "webp"] as const;
  static readonly DEFAULT_ROUTE_TYPES: readonly RouteType[] = [
    "default",
    "auth",
    "account",
    "auth-request",
    "settings",
  ];
  static readonly ALLOWED_IMG_PATHS: ReadonlySet<ImgPath> = new Set(
    Iframe.DEFAULT_ROUTE_TYPES.flatMap((route) => Iframe.IMAGE_EXTENSIONS.map((ext) => `${route}.${ext}` as ImgPath)),
  );

  // Elements:
  private host: HTMLDivElement;
  private backdrop: HTMLDivElement;
  private wrapper: HTMLDivElement;
  private iframe: HTMLIFrameElement;
  private halfImage: HTMLImageElement;

  // Config (options):
  public config: IframeConfig;

  // State:
  private imageBaseUrl: string | null = null;
  public currentLayoutType: LayoutType | null = null;
  public isOpen = false;

  constructor(src: string, options: IframeOptions = {}) {
    const cssVars = mergeCSSVariablesOption(
      options.cssVars,
      options.theme,
      Iframe.DEFAULT_LIGHT_CSS_VARS,
      Iframe.DEFAULT_DARK_CSS_VARS,
    );

    const routeLayoutOption = options.routeLayout;

    let routeLayout: null | Record<RouteType, LayoutConfig> = null;

    if (typeof routeLayoutOption === "string" || isRouteConfig(routeLayoutOption)) {
      // If a single value is passed, we use it for "default", "settings" and "auth-request" routes. "auth" and
      // "account" routes fall back to the default layout type (currently "modal"):

      const defaultLayoutConfig = Iframe.getLayoutConfig(routeLayoutOption);

      routeLayout = {
        default: defaultLayoutConfig,
        auth: Iframe.DEFAULT_CONFIG.routeLayout.auth,
        account: Iframe.DEFAULT_CONFIG.routeLayout.auth,
        settings: defaultLayoutConfig,
        "auth-request": defaultLayoutConfig,
      };
    } else {
      // If more than one value is set, the "default" option will be used for "default" routes as well as as fallback
      // for "settings" and "auth-request" routes; the "auth" option will be used for "auth" routes as well as as
      // fallback for "account" routes:

      const defaultLayoutConfig = routeLayoutOption?.default
        ? Iframe.getLayoutConfig(routeLayoutOption?.default)
        : Iframe.DEFAULT_CONFIG.routeLayout.default;

      const authLayoutConfig = routeLayoutOption?.auth
        ? Iframe.getLayoutConfig(routeLayoutOption?.auth)
        : Iframe.DEFAULT_CONFIG.routeLayout.auth;

      routeLayout = {
        default: defaultLayoutConfig,
        auth: authLayoutConfig,
        account: routeLayoutOption?.account ? Iframe.getLayoutConfig(routeLayoutOption.account) : authLayoutConfig,
        settings: routeLayoutOption?.settings
          ? Iframe.getLayoutConfig(routeLayoutOption.settings)
          : defaultLayoutConfig,
        "auth-request": routeLayoutOption?.["auth-request"]
          ? Iframe.getLayoutConfig(routeLayoutOption["auth-request"])
          : defaultLayoutConfig,
      };
    }

    this.config = {
      id: options.id || Iframe.DEFAULT_CONFIG.id,
      theme: options.theme || Iframe.DEFAULT_CONFIG.theme,
      cssVars,
      customStyles: options.customStyles || Iframe.DEFAULT_CONFIG.customStyles,
      routeLayout,
      clickOutsideBehavior: options.clickOutsideBehavior || Iframe.DEFAULT_CONFIG.clickOutsideBehavior,
    };

    this.imageBaseUrl = new URL(src).origin;

    const elements = Iframe.initializeIframe(src, this.config);

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
    if (!imgPath || !Iframe.ALLOWED_IMG_PATHS.has(imgPath as ImgPath)) {
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

  static initializeIframe(src: string, config: IframeConfig) {
    // TODO: Considering using a `<dialog>` element or adding proper aria- tags.
    const host = document.createElement("div");

    host.id = config.id;

    const shadow = host.attachShadow({ mode: "open" });
    const template = document.createElement("template");

    template.innerHTML = getIframeTemplateContent({
      customStyles: config.customStyles,
      // TODO: It would be better to create an interface with the subset of vars that we can override when changing themes:
      cssVariableKeys: Object.keys(Iframe.DEFAULT_LIGHT_CSS_VARS),
    });

    shadow.appendChild(template.content);

    const backdrop = document.createElement("div");
    backdrop.className = "backdrop";

    const wrapper = document.createElement("div");
    wrapper.className = "iframe-wrapper";

    const iframe = document.createElement("iframe");
    iframe.className = "iframe";
    iframe.allow = "camera *;";
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
    this.iframe.contentWindow?.focus();

    if (this.currentLayoutType === "half" && this.halfImage.src) {
      this.halfImage.classList.add("show");
    }
  }

  hide(): void {
    this.isOpen = false;
    this.backdrop.classList.remove("show");
    this.wrapper.classList.remove("show");
    (document.activeElement as HTMLElement)?.blur();
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

    const layoutCssVarsUpdates: Partial<IframeCSSVars> = {};

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
