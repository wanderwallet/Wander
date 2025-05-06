import {
  AuthStatus,
  BalanceInfo,
  ButtonConfig,
  ButtonCSSVars,
  ButtonOptions,
  ButtonStatus,
} from "../../wander-connect.types";
import { getButtonTemplateContent } from "./button.template";
import { addCSSVariables, mergeCSSVariablesOption } from "../../utils/styles/styles.utils";

export class Button {
  static DEFAULT_LIGHT_CSS_VARS: ButtonCSSVars = {
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
    notificationsPadding: "",
  };

  static DEFAULT_DARK_CSS_VARS: ButtonCSSVars = {
    ...Button.DEFAULT_LIGHT_CSS_VARS,

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
    notificationsPadding: "",
  };

  static DEFAULT_CONFIG = {
    id: "wanderConnectButtonHost",
    theme: "system",
    cssVars: {
      light: Button.DEFAULT_LIGHT_CSS_VARS,
      dark: Button.DEFAULT_DARK_CSS_VARS,
    },
    customStyles: "",
    parent: document.body,
    position: "bottom-right",
    wanderLogo: "default",
    label: true,
    balance: {
      balanceOf: "total",
      currency: "auto",
    },
    notifications: "counter",
    i18n: {
      loading: "Loading",
      loadingBalance: "Loading Balance",
      completeSignUp: "Complete Sign Up",
      signIn: "Sign in",
      reviewRequests: "Review requests",
    },
  } as const satisfies ButtonConfig;

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
  private config: ButtonConfig;

  // State:
  private variant: null | AuthStatus = null;
  private status: Partial<Record<ButtonStatus, boolean>> = {};

  constructor(options: ButtonOptions = {}) {
    const cssVars = mergeCSSVariablesOption(
      options.cssVars,
      options.theme,
      Button.DEFAULT_LIGHT_CSS_VARS,
      Button.DEFAULT_DARK_CSS_VARS,
    );

    this.config = {
      parent: options.parent || Button.DEFAULT_CONFIG.parent,
      id: options.id || Button.DEFAULT_CONFIG.id,
      theme: options.theme || Button.DEFAULT_CONFIG.theme,
      cssVars,
      customStyles: options.customStyles || Button.DEFAULT_CONFIG.customStyles,
      position: options.position || Button.DEFAULT_CONFIG.position,
      wanderLogo: options.wanderLogo || Button.DEFAULT_CONFIG.wanderLogo,
      label: options.label ?? Button.DEFAULT_CONFIG.label,
      balance:
        options.balance === false
          ? false
          : {
              balanceOf:
                (options.balance === true ? null : options.balance?.balanceOf) ??
                Button.DEFAULT_CONFIG.balance.balanceOf,
              currency:
                (options.balance === true ? null : options.balance?.currency) ?? Button.DEFAULT_CONFIG.balance.currency,
            },
      notifications: options.notifications || Button.DEFAULT_CONFIG.notifications,
      i18n: options.i18n || Button.DEFAULT_CONFIG.i18n,
    };

    const elements = Button.initializeButton(this.config);

    this.parent = this.config.parent;
    this.host = elements.host;
    this.button = elements.button;
    this.wanderLogo = elements.wanderLogo;
    this.label = elements.label;
    this.balance = elements.balance;
    this.indicator = elements.indicator;
    this.notifications = elements.notifications;
  }

  static initializeButton(config: ButtonConfig) {
    const host = document.createElement("div");

    host.id = config.id;

    const shadow = host.attachShadow({ mode: "open" });
    const template = document.createElement("template");

    template.innerHTML = getButtonTemplateContent({
      wanderLogo: config.wanderLogo,
      i18n: config.i18n,
      showLabel: config.label,
      showBalance: !!config.balance,
      customStyles: config.customStyles,
      // TODO: It would be better to create an interface with the subset of vars that we can override when changing themes:
      cssVariableKeys: Object.keys(Button.DEFAULT_LIGHT_CSS_VARS),
    });

    shadow.appendChild(template.content);

    const button = shadow.querySelector(".button") as HTMLButtonElement;
    const wanderLogo = shadow.querySelector(".wanderLogo") as SVGElement;
    const label = shadow.querySelector(".label") as HTMLSpanElement;
    const balance = shadow.querySelector(".balance") as HTMLSpanElement;
    const indicator = shadow.querySelector(".indicator") as HTMLSpanElement;
    const notifications = shadow.querySelector(".notifications") as HTMLSpanElement;

    if (!button || !wanderLogo || !label || !balance || !indicator || !notifications)
      throw new Error("Missing elements");

    host.style.position = "fixed";
    host.style.zIndex = "var(--zIndex)";

    if (config.position !== "static") {
      const [y, x] = config.position.split("-") as ["top" | "bottom", "left" | "right"];

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
      notifications,
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
      notifications: this.notifications,
    };
  }

  setBalance(balanceInfo: BalanceInfo) {
    if (this.balance.getAttribute("hidden")) return;

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
      this.notifications.textContent = notifications === "counter" ? `${pendingRequests}` : "!";
      this.label.textContent = i18n.reviewRequests;
    } else {
      this.notifications.textContent = "";
      this.label.textContent = "";
    }
  }

  setVariant(variant: AuthStatus) {
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
      } else {
        this.label.textContent = this.config.i18n.signIn;
        this.label.title = "";
        this.balance.textContent = "";
      }
    }
  }

  setStatus(status: ButtonStatus) {
    this.status[status] = true;
    this.button.classList.add(status);
  }

  unsetStatus(status: ButtonStatus) {
    this.status[status] = false;
    this.button.classList.remove(status);
  }

  destroy() {
    this.host?.remove();
  }
}
