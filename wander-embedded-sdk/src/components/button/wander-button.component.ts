import {
  BalanceInfo,
  isThemeRecord,
  WanderEmbeddedButtonConfig,
  WanderEmbeddedButtonCSSVars,
  WanderEmbeddedButtonOptions,
  WanderEmbeddedButtonStatus
} from "../../wander-embedded.types";
import { getWanderButtonTemplateContent } from "./wander-button.template";
import {
  addCSSVariables,
  mergeCSSVariablesOption
} from "../../utils/styles/styles.utils";
import { EmbeddedAuthStatus } from "../../utils/message/message.types";

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
    parent: document.body,
    position: "bottom-right",
    wanderLogo: "default",
    label: true,
    balance: {
      balanceOf: "total",
      currency: "auto"
    },
    notifications: "counter",
    i18n: {
      loading: "Loading",
      loadingBalance: "Loading Balance",
      completeSignUp: "Complete Sign Up",
      signIn: "Sign in",
      reviewRequests: "Review requests"
    }
  } as const satisfies WanderEmbeddedButtonConfig;

  // Elements:
  private parent: HTMLElement;
  private host: HTMLDivElement;
  private button: HTMLButtonElement;
  private wanderLogo: SVGElement;
  private label: HTMLSpanElement;
  private balance: HTMLSpanElement;
  private indicator: HTMLSpanElement;
  private notifications: HTMLSpanElement;

  // Config (options):
  private config: WanderEmbeddedButtonConfig;

  // State:
  private variant: null | EmbeddedAuthStatus = null;
  private status: Partial<Record<WanderEmbeddedButtonStatus, boolean>> = {};

  constructor(options: WanderEmbeddedButtonOptions = {}) {
    const cssVars = mergeCSSVariablesOption(
      options.cssVars,
      options.theme,
      WanderButton.DEFAULT_LIGHT_CSS_VARS,
      WanderButton.DEFAULT_DARK_CSS_VARS
    );

    this.config = {
      parent: options.parent || WanderButton.DEFAULT_CONFIG.parent,
      id: options.id || WanderButton.DEFAULT_CONFIG.id,
      theme: options.theme || WanderButton.DEFAULT_CONFIG.theme,
      cssVars,
      customStyles:
        options.customStyles || WanderButton.DEFAULT_CONFIG.customStyles,
      position: options.position || WanderButton.DEFAULT_CONFIG.position,
      wanderLogo: options.wanderLogo || WanderButton.DEFAULT_CONFIG.wanderLogo,
      label: options.label ?? WanderButton.DEFAULT_CONFIG.label,
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

    this.parent = this.config.parent;
    this.host = elements.host;
    this.button = elements.button;
    this.wanderLogo = elements.wanderLogo;
    this.label = elements.label;
    this.balance = elements.balance;
    this.indicator = elements.indicator;
    this.notifications = elements.notifications;
  }

  static initializeButton(config: WanderEmbeddedButtonConfig) {
    const host = document.createElement("div");

    host.id = config.id;

    const shadow = host.attachShadow({ mode: "open" });
    const template = document.createElement("template");

    template.innerHTML = getWanderButtonTemplateContent({
      wanderLogo: config.wanderLogo,
      showLabel: config.label,
      showBalance: !!config.balance,
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
    const notifications = shadow.querySelector(
      ".notifications"
    ) as HTMLSpanElement;

    if (
      !button ||
      !wanderLogo ||
      !label ||
      !balance ||
      !indicator ||
      !notifications
    )
      throw new Error("Missing elements");

    host.style.position = "fixed";
    host.style.zIndex = "var(--zIndex)";

    if (config.position !== "static") {
      const [y, x] = config.position.split("-") as [
        "top" | "bottom",
        "left" | "right"
      ];

      host.style[y] = "var(--gapY)";
      host.style[x] = "var(--gapX)";
    }

    host.style.transition = "opacity linear 150ms";
    host.style.opacity = "0";

    setTimeout(() => {
      host.style.opacity = "1";
    });

    addCSSVariables(host, config.cssVars.light, "Light");
    addCSSVariables(host, config.cssVars.dark, "Dark");

    label.textContent = config.i18n.signIn;

    if (config.balance === false) {
      balance.setAttribute("hidden", "true");
    }

    return {
      host,
      button,
      wanderLogo,
      label,
      balance,
      indicator,
      notifications
    };
  }

  getElements() {
    return {
      parent: this.parent,
      host: this.host,
      button: this.button,
      wanderLogo: this.wanderLogo,
      label: this.label,
      balance: this.balance,
      indicator: this.indicator,
      notifications: this.notifications
    };
  }

  setBalance(balanceInfo: BalanceInfo) {
    if (this.balance.getAttribute("hidden")) return;

    this.balance.classList.remove("isLoading");
    this.balance.textContent = balanceInfo.formattedBalance;
    this.balance.title = "";

    if (balanceInfo.amount === null) {
      this.balance.classList.add("isHidden");
    } else {
      this.balance.classList.remove("isHidden");
    }
  }

  setNotifications(pendingRequests: number) {
    const { notifications, i18n } = this.config;

    if (notifications === "off") return;

    if (pendingRequests > 0) {
      this.notifications.textContent =
        notifications === "counter" ? `${pendingRequests}` : "!";
      this.label.textContent = i18n.reviewRequests;
    } else {
      this.notifications.textContent = "";
      this.label.textContent = "";
    }
  }

  setVariant(variant: EmbeddedAuthStatus) {
    console.log("setVariant =", variant);

    this.variant = variant;
    this.button.dataset.variant = variant;

    if (variant === "loading") {
      this.indicator.classList.add("isLoading");
      this.label.classList.add("isLoading");
      this.label.textContent = "";
      this.label.title = this.config.i18n.loading;
    } else {
      this.indicator.classList.remove("isLoading");
      this.label.classList.remove("isLoading");

      if (variant === "onboarding") {
        this.label.textContent = "Wander";
        this.label.title = this.config.i18n.completeSignUp;
      } else if (variant === "authenticated") {
        this.label.textContent = "";
        this.label.title = "";
        this.balance.classList.add("isLoading");
        this.balance.textContent = "";
        this.balance.title = this.config.i18n.loadingBalance;
      } else {
        this.label.textContent = this.config.i18n.signIn;
        this.label.title = "";
        this.balance.classList.remove("isLoading");
        this.balance.textContent = "";
        this.balance.title = "";
      }
    }
  }

  setStatus(status: WanderEmbeddedButtonStatus) {
    this.status[status] = true;
    this.button.classList.add(status);
  }

  unsetStatus(status: WanderEmbeddedButtonStatus) {
    this.status[status] = false;
    this.button.classList.remove(status);
  }

  destroy() {
    this.host?.remove();
  }
}
