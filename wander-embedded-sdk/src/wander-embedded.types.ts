import { IncomingAuthMessageData } from "./utils/message/message.types";

/**
 * Types of routes available in the Wander Embedded SDK.
 */
export type RouteType =
  /** Default home screen */
  | "default"
  /** Authentication screen */
  | "auth"
  /** Account management screen */
  | "account"
  /** Settings and preferences screen */
  | "settings"
  /** Authorization request screen for approving transactions. */
  | "auth-request";

/** Supported image extensions */
export type ImageExtension = "webp" | "png";

/** Supported Image Path */
export type ImgPath = `${RouteType}.${ImageExtension}`;

/** Modal layout configuration */
export interface ModalLayoutConfig {
  /**
   * Specifies this is a modal layout type.
   * @required
   */
  type: "modal";

  /** Fixed width in pixels
   * @default Auto-sized based on content */
  fixedWidth?: number;

  /** Fixed height in pixels
   * @default Auto-sized based on content */
  fixedHeight?: number;

  /** Expand to full screen on mobile
   * @default true */
  expandOnMobile?: boolean;
}

/**
 * Configuration for popup layout type.
 * Defines appearance and behavior of the popup layout, which appears anchored to a corner of the screen.
 */
export interface PopupLayoutConfig {
  /**
   * Specifies this is a popup layout type.
   * @required
   */
  type: "popup";

  /**
   * Position of the popup on the screen.
   * @default "bottom-right"
   */
  position?: WanderEmbeddedPopupPosition;

  /** Fixed width in pixels
   * @default Auto-sized based on content */
  fixedWidth?: number;

  /** Fixed height in pixels
   * @default Auto-sized based on content */
  fixedHeight?: number;

  /** Expand to full screen on mobile
   * @default true */
  expandOnMobile?: boolean;
}

/**
 * Configuration for sidebar layout type.
 * Defines appearance and behavior of the sidebar layout, which appears as a panel on the left or right side of the screen.
 */
export interface SidebarLayoutConfig {
  /**
   * Specifies this is a sidebar layout type.
   * @required
   */
  type: "sidebar";

  /**
   * Position of the sidebar on the screen.
   * Determines whether the sidebar appears on the left or right side of the screen.
   * @default "right"
   */
  position?: "left" | "right";

  /** Start in expanded state
   * @default true */
  expanded?: boolean;

  /** Fixed width in pixels
   * @default 375 */
  fixedWidth?: number;

  /** Expand to full screen on mobile
   * @default true */
  expandOnMobile?: boolean;
}

/**
 * Configuration for half-screen layout type.
 * Defines appearance and behavior of the half-screen layout, which takes up approximately half of the viewport.
 */
export interface HalfLayoutConfig {
  /**
   * Specifies this is a half-screen layout type.
   * @required
   */
  type: "half";

  /**
   * Position of the half-screen panel.
   * Determines whether the panel appears on the left or right side of the screen.
   * @default "right"
   */
  position?: "left" | "right";

  /** Start in expanded state
   * @default true */
  expanded?: boolean;

  /** Background image URL */
  // imgSrc?: string;

  /** Expand to full screen on mobile
   * @default true */
  expandOnMobile?: boolean;
}

/**
 * Union of all layout configurations
 * A type that can be any of the supported layout types (modal, popup, sidebar, half).
 */
export type LayoutConfig =
  | ModalLayoutConfig
  | PopupLayoutConfig
  | SidebarLayoutConfig
  | HalfLayoutConfig;

/**
 * Available layout type names
 */
export type LayoutType = LayoutConfig["type"];

/**
 * Array of all supported layout types
 */
export const LAYOUT_TYPES = [
  "modal",
  "popup",
  "sidebar",
  "half"
] as const satisfies LayoutType[];

/** Validates if an object is a valid layout configuration
 * @param obj Object to check
 * @returns True if object is a valid layout configuration
 */
export function isRouteConfig(obj: unknown): obj is LayoutConfig {
  return !!(
    obj &&
    typeof obj === "object" &&
    "type" in obj &&
    LAYOUT_TYPES.includes(obj.type as LayoutType)
  );
}

/**
 * Configuration for a specific route.
 * Contains layout and dimension information for a particular UI route.
 */
export interface RouteConfig {
  /**
   * Type of the current route.
   */
  routeType: RouteType;

  /**
   * Preferred layout type for this route.
   */
  preferredLayoutType: LayoutType;

  /** Content height in pixels */
  height: number;

  /** Content width in pixels (optional) */
  width?: number;

  /** Background image URL (optional) */
  // imgSrc?: string;
}

export type AuthState = IncomingAuthMessageData;

/** User's wallet balance information */
export interface BalanceInfo {
  /**
   * Amount in the specified currency.
   */
  amount: number | null;

  /**
   * Currency code.
   */
  currency: Currency | null;

  /**
   * Formatted amount in the specified currency;
   */
  formattedBalance: string;
}

export interface RequestsInfo {
  pendingRequests: number;
  hasNewConnectRequest: boolean;
}

/** Main configuration options for the Wander Embedded SDK */
export interface WanderEmbeddedOptions {
  /**
   * Client ID for your App, registered on the Wander Dashboard.
   * @required
   */
  clientId: string;

  /**
   * Theme setting for the Wander Connect UI. It will also be used as the default value for `iframe.theme` and
   * `button.theme`.
   * Controls whether the component uses light, dark, or system-based theming.
   */
  theme?: ThemeSetting;

  /**
   * `true` to hide the Wander button on the authentication screen, which allow users that have the Wander browser
   * extension installed to use that instead of Wander Connect. This implies no authentication information will be
   * available from users who use the browser extension.
   */
  hideBE?: boolean;

  /**
   * Base URL for the Wander Embed client app.
   * The URL where the Wander Embed client is hosted.
   * Only change this if you're using a custom or self-hosted version of the embed client.
   * @default "https://embed-dev.wander.app"
   */
  baseURL?: string;

  /**
   * Base URL for the Wander Embed tRPC server.
   * The URL where the Wander Embed API server is hosted.
   * Only change this if you're using a custom or self-hosted version of the embed API.
   * @default "https://embed-api-dev.wander.app"
   */
  baseServerURL?: string;

  /**
   * Configuration options for the iframe component or an existing iframe element.
   */
  iframe?: WanderEmbeddedIframeOptions | HTMLIFrameElement;

  /**
   * Configure the button that opens the wallet UI, or set to true to use default settings.
   * The button can be styled and positioned in various ways.
   * @default true - Default Button is shown unless explicitly configured
   */
  button?: WanderEmbeddedButtonOptions | boolean;

  /**
   * Callback function called when authentication state changes.
   * @param userDetails User details object when signed in, or null when signed out
   */
  onAuth?: (authState: AuthState) => void;

  /**
   * Callback function called when the wallet interface is opened.
   */
  onOpen?: () => void;

  /**
   * Callback function called when the wallet interface is closed.
   */
  onClose?: () => void;

  /**
   * Callback function called when the wallet interface is resized.
   * @param routeConfig Current route configuration
   */
  onResize?: (routeConfig: RouteConfig) => void;

  /**
   * Callback function called when the balance information changes.
   * @param balanceInfo Current balance information including amount and currency
   */
  onBalance?: (balanceInfo: BalanceInfo) => void;

  /**
   * Callback function called when wallet receives a request.
   * @param pendingRequests Number of pending requests
   */
  onRequest?: (requestsInfo: RequestsInfo) => void;
}

// Common:

/** Theme variants */
export type ThemeVariant =
  /** Light color scheme */
  | "light"
  /** Dark color scheme */
  | "dark";

/** Theme setting options. */
export type ThemeSetting = "system" | ThemeVariant;

/**
 * Options for Wander Embedded components.
 * Base interface for component customization options shared by iframe and button components.
 * @template T The type of CSS variables available for styling the component
 */
export interface WanderEmbeddedComponentOptions<T> {
  /**
   * ID of the component element.
   */
  id?: string;

  /**
   * Theme setting for the component.
   * Controls whether the component uses light, dark, or system-based theming.
   */
  theme?: ThemeSetting;

  /**
   * CSS variables for styling the component.
   * Can be provided as a single set of variables applied to both themes,
   * or as separate light and dark theme variables.
   */
  cssVars?: Partial<T> | Partial<Record<ThemeVariant, Partial<T>>>;

  /**
   * Custom CSS styles for the component.
   * Must use proper CSS selectors due to Shadow DOM encapsulation.
   */
  customStyles?: string;
}

/**
 * Configuration for Wander Embedded components.
 * Resolved configuration with all required fields set.
 * @template T The type of CSS variables for this component
 */
export interface WanderEmbeddedComponentConfig<T>
  extends Required<WanderEmbeddedComponentOptions<T>> {
  /**
   * CSS variables for both light and dark themes.
   */
  cssVars: Record<ThemeVariant, T>;
}

/** Checks if CSS variables contain theme-specific settings
 * @param cssVars CSS variables object
 * @returns True if theme-specific
 */
export function isThemeRecord<T>(
  cssVars: Partial<T> | Partial<Record<ThemeVariant, Partial<T>>>
): cssVars is Partial<Record<ThemeVariant, Partial<T>>> {
  return !!(
    cssVars &&
    typeof cssVars === "object" &&
    ("light" in cssVars || "dark" in cssVars)
  );
}

// Modal (iframe):

/**
 * Configuration options for the iframe.
 * Customizes the appearance and behavior of the Wander Embedded iframe,
 * which displays the wallet UI.
 */
export interface WanderEmbeddedIframeOptions
  extends WanderEmbeddedComponentOptions<WanderEmbeddedIframeCSSVars> {
  // TODO: Default should automatically be used for auth-requests, and auth for account and settings?
  /**
   * Layout configuration for different routes.
   * Controls how the iframe is displayed for each route type:
   * - If a single value is passed, we use it for "default", "settings" and "auth-request" routes. "auth" and "account"
   *   routes fall back to the default layout type (currently "modal").
   * - If more than one value is set, the "default" option will be used for "default" routes as well as as fallback for
   *   "settings" and "auth-request" routes; the "auth" option will be used for "auth" routes as well as as fallback for
   *   "account" routes.
   */
  routeLayout?:
    | LayoutType
    | LayoutConfig
    | Partial<Record<RouteType, LayoutType | LayoutConfig>>;

  /**
   * Close Wander Embedded when clicking outside of it.
   * Controls the behavior when a user clicks outside the iframe:
   * - false: Will never close. The user must click the close icon.
   * - true: Will always close when clicking outside.
   * @default "auto"
   */
  clickOutsideBehavior?: boolean;
}

/**
 * Configuration for the iframe component.
 */
export interface WanderEmbeddedIframeConfig
  extends WanderEmbeddedComponentConfig<WanderEmbeddedIframeCSSVars> {
  /**
   * Layout configuration for all route types.
   * Complete mapping of route types to their layout configuration.
   */
  routeLayout: Record<RouteType, LayoutConfig>;

  /**
   * Behavior when clicking outside the iframe.
   * How the component responds to clicks outside its boundaries.
   */
  clickOutsideBehavior: boolean;
}

// Button:

/**
 * Position of the button on the screen.
 * Determines where the button appears on the screen.
 */
export type WanderEmbeddedButtonPosition =
  | "top-right"
  | "bottom-right"
  | "top-left"
  | "bottom-left"
  | "static";

/**
 * Position of the popup on the screen.
 * Determines where the popup appears on the screen.
 */
export type WanderEmbeddedPopupPosition =
  | "top-right"
  | "bottom-right"
  | "top-left"
  | "bottom-left";

/**
 * Variant of the Wander logo to display.
 * Controls how the Wander logo appears on the button.
 */
export type WanderEmbeddedLogoVariant = "none" | "default" | "text-color";

/**
 * Configuration for balance display in the button.
 * Controls which balance is displayed and in what currency.
 */
export interface WanderEmbeddedBalanceOptions {
  /**
   * Determines which token or total balance is shown.
   * @param "total" Show total balance across all tokens
   * @param string Token ID to show specific token balance
   * @default "total"
   */
  balanceOf: "total" | string;

  /**
   * Determines the currency used to display the balance.
   * @param "auto" Use user's selected currency from their wallet preferences
   * @param string Specific token ID or currency symbol (e.g., "USD", "EUR")
   * @default "auto"
   */
  currency: "auto" | string;
}

/** Notification display options */
export type WanderEmbeddedButtonNotifications =
  /** No notifications shown */
  | "off"
  /** Show count of pending requests */
  | "counter"
  /** Show indicator without count */
  | "alert";

/**
 * Custom labels for button text.
 */
export interface WanderEmbeddedButtonLabels {
  /**
   * Title/tooltip to display when the button is loading.
   * @default "Loading"
   */
  loading: string;

  /**
   * Title/tooltip to display when the balance is loading.
   * @default "Loading Balance"
   */
  loadingBalance: string;

  /**
   * Title/tooltip to display when the user is authenticated, but the onboarding
   * hasn't been completed.
   * @default "Complete Sign Up"
   */
  completeSignUp: string;

  /**
   * Text to display when the user is not authenticated.
   * @default "Sign In"
   */
  signIn: string;

  /**
   * Text to display when the user has request to review.
   * @default "Review Requests"
   */
  reviewRequests: string;
}

/**
 * Configuration options for the button component.
 * Customizes the appearance and behavior of the Wander Embedded button.
 */
export interface WanderEmbeddedButtonOptions
  extends WanderEmbeddedComponentOptions<WanderEmbeddedButtonCSSVars> {
  /**
   * Element the button will be appended to.
   * @default document.body
   */
  parent?: HTMLElement;

  /**
   * Position of the button on the screen.
   * Use "static" for custom positioning via CSS.
   * @default "bottom-right"
   */
  position?: WanderEmbeddedButtonPosition;

  /**
   * Variant of the Wander logo to display.
   * - "none": No logo is displayed
   * - "default": Standard Wander logo is displayed
   * - "text-color": Logo with colored text is displayed
   * @default "default"
   */
  wanderLogo?: WanderEmbeddedLogoVariant;

  /**
   * Whether to show the button label.
   * @default true
   */
  label?: boolean;

  /**
   * Configuration for displaying balance information.
   * - false: No balance is displayed
   * - true: Balance is displayed
   * - WanderEmbeddedBalanceOptions: Customized balance display
   * @default { balanceOf: "total", currency: "auto" }
   */
  balance?: boolean | WanderEmbeddedBalanceOptions;

  /**
   * Type of notifications to display.
   * @default "counter"
   */
  notifications?: WanderEmbeddedButtonNotifications;

  /**
   * Custom labels for button text.
   * @default { signIn: "Sign in", reviewRequests: "Review requests" }
   */
  i18n?: WanderEmbeddedButtonLabels;
}

/**
 * Configuration for the button component.
 */
export interface WanderEmbeddedButtonConfig
  extends WanderEmbeddedComponentConfig<WanderEmbeddedButtonCSSVars> {
  /**
   * Element the button will be appended to.
   */
  parent: HTMLElement;

  /**
   * Position of the button on the screen.
   */
  position: WanderEmbeddedButtonPosition;

  /**
   * Variant of the Wander logo to display.
   */
  wanderLogo: WanderEmbeddedLogoVariant;

  /**
   * Whether to show the button label.
   */
  label: boolean;

  /**
   * Configuration for displaying balance information.
   */
  balance: false | WanderEmbeddedBalanceOptions;

  /**
   * Type of notifications to display.
   */
  notifications: WanderEmbeddedButtonNotifications;

  /**
   * Custom labels for button text.
   */
  i18n: WanderEmbeddedButtonLabels;
}

/**
 * Button status properties that can be observed.
 */
export type WanderEmbeddedButtonStatus =
  /** Whether the user's wallet is connected to the application. */
  | "isConnected"
  /** Whether the wallet UI is currently open. */
  | "isOpen";

// Styles:

/**
 * CSS variables for styling the modal/iframe component.
 */
export interface WanderEmbeddedIframeCSSVars {
  // Modal (iframe):
  /**
   * Background color of the modal.
   */
  background: string;

  /**
   * Border width of the modal.
   */
  borderWidth: number;

  /**
   * Border color of the modal.
   */
  borderColor: string;

  /**
   * Border radius of the modal.
   */
  borderRadius: number | string;

  /**
   * Box shadow of the modal.
   */
  boxShadow: string;

  /**
   * Z-index of the modal.
   */
  zIndex: string;

  /**
   * Preferred width of the modal.
   */
  preferredWidth: number | string;

  /**
   * Preferred height of the modal.
   */
  preferredHeight: number | string;

  // App wrapper (content inside iframe):

  /**
   * Padding inside the iframe.
   */
  contentPadding: number;

  /**
   * Maximum width of the iframe content.
   */
  contentMaxWidth: number | string;

  /**
   * Maximum height of the iframe content.
   */
  contentMaxHeight: number | string;

  // Backdrop (div):

  /**
   * Background color of the backdrop.
   */
  backdropBackground: string;

  /**
   * Backdrop filter applied to the backdrop.
   */
  backdropBackdropFilter: string;

  /**
   * Padding around the modal within the backdrop.
   */
  backdropPadding: number | string;

  // Mobile specific styles
  /**
   * Padding on mobile devices.
   */
  mobilePadding: number;

  /**
   * Height on mobile devices.
   */
  mobileHeight: string | number;

  /**
   * Border radius on mobile devices.
   */
  mobileBorderRadius: number;

  /**
   * Border width on mobile devices.
   */
  mobileBorderWidth: number;

  /**
   * Border color on mobile devices.
   */
  mobileBorderColor: string;

  /**
   * Box shadow on mobile devices.
   */
  mobileBoxShadow: string;
}

/**
 * CSS variables for styling the button component.
 */
export interface WanderEmbeddedButtonCSSVars {
  // Button (button):
  /**
   * Horizontal gap from the edge of the screen.
   * Not used when position is "static".
   * @default 16
   */
  gapX: number | string;

  /**
   * Vertical gap from the edge of the screen.
   * Not used when position is "static".
   * @default 16
   */
  gapY: number | string;

  /**
   * Gap between elements inside the button.
   * @default 12
   */
  gapInside: number | string;

  /**
   * Minimum width of the button.
   * @default 0
   */
  minWidth: number | string;

  /**
   * Minimum height of the button.
   * @default 0
   */
  minHeight: number | string;

  /**
   * Z-index of the button.
   * @default "9999"
   */
  zIndex: string;

  /**
   * Padding of the button.
   * @default "12px 20px 12px 16px"
   */
  padding: number | string;

  /**
   * Font style of the button.
   * @default "16px monospace"
   */
  font: string;

  // Button (button, affected by :hover & :focus):
  /**
   * Background color of the button.
   * @default "white" in light mode, "black" in dark mode
   */
  background: string;

  /**
   * Text color of the button.
   * @default "black" in light mode, "white" in dark mode
   */
  color: string;

  /**
   * Border width of the button.
   * @default 2
   */
  borderWidth: number | string;

  /**
   * Border color of the button.
   * @default "white" in light mode, "black" in dark mode
   */
  borderColor: string;

  /**
   * Border radius of the button.
   * @default 128
   */
  borderRadius: number | string;

  /**
   * Box shadow of the button.
   * @default "0 0 32px 0px rgba(0, 0, 0, 0.25)"
   */
  boxShadow: string;

  // TODO: Vars below are not used yet:

  // Logo (img / svg):
  /**
   * Background color of the logo.
   * @default ""
   */
  logoBackground: string;

  /**
   * Border width of the logo.
   * @default ""
   */
  logoBorderWidth: number | string;

  /**
   * Border color of the logo.
   * @default ""
   */
  logoBorderColor: string;

  /**
   * Border radius of the logo.
   * @default ""
   */
  logoBorderRadius: number | string;

  // Notifications (span):
  /**
   * Background color of the notifications badge.
   * @default ""
   */
  notificationsBackground: string;

  /**
   * Border width of the notifications badge.
   * @default ""
   */
  notificationsBorderWidth: number | string;

  /**
   * Border color of the notifications badge.
   * @default ""
   */
  notificationsBorderColor: string;

  /**
   * Border radius of the notifications badge.
   * @default ""
   */
  notificationsBorderRadius: number | string;

  /**
   * Box shadow of the notifications badge.
   * @default ""
   */
  notificationsBoxShadow: string;

  /**
   * Padding of the notifications badge.
   * @default ""
   */
  notificationsPadding: number | string;
}

// TODO: :hover and :focus specific styling.

/**
 * Supported currency codes.
 */
export type Currency =
  | "USD"
  | "EUR"
  | "GBP"
  | "CNY"
  | "INR"
  | "AED"
  | "ARS"
  | "AUD"
  | "BDT"
  | "BHD"
  | "BMD"
  | "BRL"
  | "CAD"
  | "CHF"
  | "CLP"
  | "CZK"
  | "DKK"
  | "HKD"
  | "HUF"
  | "IDR"
  | "ILS"
  | "JPY"
  | "KRW"
  | "KWD"
  | "LKR"
  | "MMK"
  | "MXN"
  | "MYR"
  | "NGN"
  | "NOK"
  | "NZD"
  | "PHP"
  | "PKR"
  | "PLN"
  | "RUB"
  | "SAR"
  | "SEK"
  | "SGD"
  | "THB"
  | "TRY"
  | "TWD"
  | "UAH"
  | "VEF"
  | "VND"
  | "ZAR";
