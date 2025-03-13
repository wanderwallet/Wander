import {
  BalanceInfo,
  isThemeRecord,
  WanderEmbeddedButtonConfig,
  WanderEmbeddedButtonCSSVars,
  WanderEmbeddedButtonOptions,
  WanderEmbeddedButtonStatus
} from "../../wander-embedded.types";
import { getWanderButtonTemplateContent } from "./wander-button.template";
import { addCSSVariables } from "../../utils/styles/styles.utils";
import { merge } from "ts-deepmerge";

export class WanderButton {
  static DEFAULT_LIGHT_CSS_VARS: WanderEmbeddedButtonCSSVars = {
    // Button (button):
    gapX: 16,
    gapY: 16,
    gapInside: 12,
    minWidth: 0,
    minHeight: 0,
    zIndex: "9999",
    padding: "12px 20px 12px 16px",
    font: "16px monospace",

    // Button (button, affected by :hover & :focus):
    background: "white",
    color: "black",
    borderWidth: 2,
    borderColor: "white",
    borderRadius: 128,
    boxShadow: "0 0 32px 0px rgba(0, 0, 0, 0.25)",

    // Logo (img / svg):
    logoBackground: "",
    logoBorderWidth: "",
    logoBorderColor: "",
    logoBorderRadius: "",

    // Notifications (span):
    notificationsBackground: "",
    notificationsBorderWidth: "",
    notificationsBorderColor: "",
    notificationsBorderRadius: "",
    notificationsBoxShadow: "",
    notificationsPadding: ""
  };

  static DEFAULT_DARK_CSS_VARS: WanderEmbeddedButtonCSSVars = {
    ...WanderButton.DEFAULT_LIGHT_CSS_VARS,

    // Button (button, affected by :hover & :focus):
    background: "black",
    color: "white",
    borderColor: "black",

    // Logo (img / svg):
    logoBackground: "",
    logoBorderWidth: "",
    logoBorderColor: "",
    logoBorderRadius: "",

    // Notifications (span):
    notificationsBackground: "",
    notificationsBorderWidth: "",
    notificationsBorderColor: "",
    notificationsBorderRadius: "",
    notificationsBoxShadow: "",
    notificationsPadding: ""
  };

  static DEFAULT_CONFIG = {
    id: "wanderEmbeddedButtonHost",
    theme: "system",
    cssVars: {
      light: WanderButton.DEFAULT_LIGHT_CSS_VARS,
      dark: WanderButton.DEFAULT_DARK_CSS_VARS
    },
    customStyles: "",
    position: "bottom-right",
    wanderLogo: "default",
    dappLogoSrc: "",
    label: true,
    balance: {
      balanceOf: "total",
      currency: "auto"
    },
    notifications: "counter",
    i18n: {
      signIn: "Sign in",
      reviewRequests: "Review requests"
    }
  } as const satisfies WanderEmbeddedButtonConfig;

  // Elements:
  private host: HTMLDivElement;
  private button: HTMLButtonElement;
  private wanderLogo: SVGElement;
  private label: HTMLSpanElement;
  private balance: HTMLSpanElement;
  private indicator: HTMLSpanElement;
  private dappLogo: HTMLImageElement;
  private notifications: HTMLSpanElement;

  // Config (options):
  private config: WanderEmbeddedButtonConfig;

  // State:
  private status: Partial<Record<WanderEmbeddedButtonStatus, boolean>> = {};

  constructor(options: WanderEmbeddedButtonOptions = {}) {
    const cssVars = options.cssVars || {};

    let cssVarsLight: WanderEmbeddedButtonCSSVars =
      WanderButton.DEFAULT_LIGHT_CSS_VARS;
    let cssVarsDark: WanderEmbeddedButtonCSSVars =
      WanderButton.DEFAULT_DARK_CSS_VARS;

    if (Object.keys(cssVars).length > 0) {
      if (isThemeRecord(cssVars)) {
        cssVarsLight = merge(
          cssVars?.light || {},
          WanderButton.DEFAULT_LIGHT_CSS_VARS
        ) as WanderEmbeddedButtonCSSVars;
        cssVarsDark = merge(
          cssVars?.dark || {},
          WanderButton.DEFAULT_DARK_CSS_VARS
        ) as WanderEmbeddedButtonCSSVars;
      } else if (options.theme !== "dark") {
        cssVarsLight = merge(
          cssVars || {},
          WanderButton.DEFAULT_LIGHT_CSS_VARS
        ) as WanderEmbeddedButtonCSSVars;
      } else {
        cssVarsDark = merge(
          cssVars || {},
          WanderButton.DEFAULT_DARK_CSS_VARS
        ) as WanderEmbeddedButtonCSSVars;
      }
    }

    this.config = {
      id: options.id || WanderButton.DEFAULT_CONFIG.id,
      theme: options.theme || WanderButton.DEFAULT_CONFIG.theme,
      cssVars: {
        light: cssVarsLight,
        dark: cssVarsDark
      },
      customStyles:
        options.customStyles || WanderButton.DEFAULT_CONFIG.customStyles,
      position: options.position || WanderButton.DEFAULT_CONFIG.position,
      wanderLogo: options.wanderLogo || WanderButton.DEFAULT_CONFIG.wanderLogo,
      dappLogoSrc:
        options.dappLogoSrc || WanderButton.DEFAULT_CONFIG.dappLogoSrc,
      label: options.label || WanderButton.DEFAULT_CONFIG.label,
      balance:
        options.balance === false
          ? false
          : {
              balanceOf:
                (options.balance === true
                  ? null
                  : options.balance?.balanceOf) ??
                WanderButton.DEFAULT_CONFIG.balance.balanceOf,
              currency:
                (options.balance === true ? null : options.balance?.currency) ??
                WanderButton.DEFAULT_CONFIG.balance.currency
            },
      notifications:
        options.notifications || WanderButton.DEFAULT_CONFIG.notifications,
      i18n: options.i18n || WanderButton.DEFAULT_CONFIG.i18n
    };

    const elements = WanderButton.initializeButton(this.config);

    this.host = elements.host;
    this.button = elements.button;
    this.wanderLogo = elements.wanderLogo;
    this.label = elements.label;
    this.balance = elements.balance;
    this.indicator = elements.indicator;
    this.dappLogo = elements.dappLogo;
    this.notifications = elements.notifications;
  }

  static initializeButton(config: WanderEmbeddedButtonConfig) {
    const host = document.createElement("div");

    host.id = config.id;
    host.setAttribute("data-theme", config.theme);

    const shadow = host.attachShadow({ mode: "open" });
    const template = document.createElement("template");

    template.innerHTML = getWanderButtonTemplateContent({
      wanderLogo: config.wanderLogo,
      customStyles: config.customStyles,
      // TODO: It would be better to create an interface with the subset of vars that we can override when changing themes:
      cssVariableKeys: Object.keys(WanderButton.DEFAULT_LIGHT_CSS_VARS)
    });

    shadow.appendChild(template.content);

    const button = shadow.querySelector(".button") as HTMLButtonElement;
    const wanderLogo = shadow.querySelector(".wanderLogo") as SVGElement;
    const label = shadow.querySelector(".label") as HTMLSpanElement;
    const balance = shadow.querySelector(".balance") as HTMLSpanElement;
    const indicator = shadow.querySelector(".indicator") as HTMLSpanElement;
    const dappLogo = shadow.querySelector(".dappLogo") as HTMLImageElement;
    const notifications = shadow.querySelector(
      ".notifications"
    ) as HTMLSpanElement;

    if (
      !button ||
      !wanderLogo ||
      !label ||
      !balance ||
      !indicator ||
      !dappLogo ||
      !notifications
    )
      throw new Error("Missing elements");

    const [y, x] = config.position.split("-") as [
      "top" | "bottom",
      "left" | "right"
    ];

    host.style.position = "fixed";
    host.style[y] = "var(--gapY)";
    host.style[x] = "var(--gapX)";
    host.style.transition = "opacity linear 150ms";
    host.style.opacity = "0";

    setTimeout(() => {
      host.style.opacity = "1";
    });

    addCSSVariables(host, config.cssVars.light);
    addCSSVariables(host, config.cssVars.dark, "Dark");

    label.textContent = config.i18n.signIn;

    if (config.balance === false) {
      balance.setAttribute("hidden", "true");
    }

    dappLogo.src = config.dappLogoSrc;

    return {
      host,
      button,
      wanderLogo,
      label,
      balance,
      indicator,
      dappLogo,
      notifications
    };
  }

  getElements() {
    return {
      host: this.host,
      button: this.button,
      wanderLogo: this.wanderLogo,
      label: this.label,
      balance: this.balance,
      indicator: this.indicator,
      dappLogo: this.dappLogo,
      notifications: this.notifications
    };
  }

  setBalance(balanceInfo: BalanceInfo) {
    const formattedBalance = new Intl.NumberFormat(undefined, {
      currency: balanceInfo.currency
    }).format(balanceInfo.amount);

    this.balance.textContent = `${formattedBalance}`;
  }

  setNotifications(pendingRequests: number) {
    const { label, notifications, i18n } = this.config;

    if (notifications === "off") return;

    if (pendingRequests > 0) {
      this.notifications.textContent =
        notifications === "counter" ? `${pendingRequests}` : "!";
      this.label.textContent = label ? i18n.reviewRequests : "";
    } else {
      this.notifications.textContent = "";
      this.label.textContent = label
        ? this.status.isAuthenticated
          ? ""
          : i18n.signIn
        : "";
    }
  }

  setStatus(status: WanderEmbeddedButtonStatus) {
    this.status[status] = true;
    this.button.classList.add(status);

    if (status === "isAuthenticated") {
      this.label.textContent = "";
    }
  }

  unsetStatus(status: WanderEmbeddedButtonStatus) {
    this.status[status] = false;
    this.button.classList.add(status);

    if (status === "isAuthenticated") {
      this.label.textContent = this.config.label ? this.config.i18n.signIn : "";
    }
  }
}
