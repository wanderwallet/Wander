import { UserDetails } from "./utils/message/message.types";

/**
 * Types of routes available in the Wander Embedded SDK.
 */
export type RouteType =
  | "default"
  | "auth"
  | "account"
  | "settings"
  | "auth-request";

/**
 * Configuration for modal layout type.
 */
export interface ModalLayoutConfig {
  type: "modal";
  /**
   * Fixed width of the modal in pixels.
   */
  fixedWidth?: number;
  /**
   * Fixed height of the modal in pixels.
   */
  fixedHeight?: number;
  /**
   * Whether to expand to full screen on mobile devices.
   */
  expandOnMobile?: boolean;
}

/**
 * Configuration for popup layout type.
 */
export interface PopupLayoutConfig {
  type: "popup";
  /**
   * Position of the popup on the screen.
   */
  position?: WanderEmbeddedPopupPosition;
  /**
   * Fixed width of the popup in pixels.
   */
  fixedWidth?: number;
  /**
   * Fixed height of the popup in pixels.
   */
  fixedHeight?: number;
  /**
   * Whether to expand to full screen on mobile devices.
   */
  expandOnMobile?: boolean;
}

/**
 * Configuration for sidebar layout type.
 */
export interface SidebarLayoutConfig {
  type: "sidebar";
  /**
   * Position of the sidebar on the screen.
   */
  position?: "left" | "right";
  /**
   * Whether the sidebar starts expanded.
   */
  expanded?: boolean;
  /**
   * Fixed width of the sidebar in pixels.
   */
  fixedWidth?: number;
  /**
   * Whether to expand to full screen on mobile devices.
   */
  expandOnMobile?: boolean;
}

/**
 * Configuration for half-screen layout type.
 */
export interface HalfLayoutConfig {
  type: "half";
  /**
   * Position of the half-screen panel.
   */
  position?: "left" | "right";
  /**
   * Whether the panel starts expanded.
   */
  expanded?: boolean;
  /**
   * URL of the background image.
   */
  imgSrc?: string;
  /**
   * Whether to expand to full screen on mobile devices.
   */
  expandOnMobile?: boolean;
}

/**
 * Union type of all possible layout configurations.
 */
export type LayoutConfig =
  | ModalLayoutConfig
  | PopupLayoutConfig
  | SidebarLayoutConfig
  | HalfLayoutConfig;

/**
 * Available layout types.
 */
export type LayoutType = LayoutConfig["type"];

/**
 * Array of available layout types.
 */
export const LAYOUT_TYPES = [
  "modal",
  "popup",
  "sidebar",
  "half"
] as const satisfies LayoutType[];

/**
 * Type guard to check if an object is a valid layout configuration.
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
  /**
   * Height of the route content in pixels.
   */
  height: number;
  /**
   * Optional width of the route content in pixels.
   */
  width?: number;
  /**
   * Optional background image URL.
   */
  imgSrc?: string;
}

/**
 * Balance information structure.
 */
export interface BalanceInfo {
  /**
   * Amount in the specified currency.
   */
  amount: number;
  /**
   * Currency code.
   */
  currency: Currency;
}

/**
 * Configuration options for the Wander Embedded SDK.
 */
export interface WanderEmbeddedOptions {
  /**
   * Client ID for your App, registered on the Wander Dashboard.
   */
  clientId: string;

  /**
   * Base URL for the Wander Embed client app.
   */
  baseURL?: string;

  /**
   * Base URL for the Wander Embed tRPC server.
   */
  baseServerURL?: string;

  /**
   * Configuration options for the iframe component or an existing iframe element.
   */
  iframe?: WanderEmbeddedIframeOptions | HTMLIFrameElement;

  /**
   * Configuration options for the button component or boolean to enable with defaults.
   */
  button?: WanderEmbeddedButtonOptions | boolean;

  // TODO: Also export the param types:
  /**
   * Callback function called when authentication state changes.
   * @param userDetails User details object or null when signed out
   */
  onAuth?: (userDetails: UserDetails | null) => void;

  /**
   * Callback function called when the wallet interface is opened.
   */
  onOpen?: () => void;

  /**
   * Callback function called when the wallet interface is closed.
   */
  onClose?: () => void;

  /**
   * Callback function called when the embed wallet is resized.
   * @param routeConfig Current route configuration
   */
  onResize?: (routeConfig: RouteConfig) => void;

  /**
   * Callback function called when the balance information changes.
   * @param balanceInfo Current balance information
   */
  onBalance?: (balanceInfo: BalanceInfo) => void;

  /**
   * Callback function called when embed wallet receives a request.
   * @param pendingRequests Number of pending requests
   */
  onRequest?: (pendingRequests: number) => void;
}

// Common:

/**
 * Theme variant options.
 */
export type ThemeVariant = "light" | "dark";

/**
 * Theme setting options.
 */
export type ThemeSetting = "system" | ThemeVariant;

/**
 * Options for Wander Embedded components.
 */
export interface WanderEmbeddedComponentOptions<T> {
  /**
   * ID of the component element.
   */
  id?: string;
  /**
   * Theme setting for the component.
   */
  theme?: ThemeSetting;
  /**
   * CSS variables for styling the component.
   * Can be a single set of variables or separate light/dark theme variables.
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
 */
export interface WanderEmbeddedComponentConfig<T>
  extends Required<WanderEmbeddedComponentOptions<T>> {
  /**
   * CSS variables for both light and dark themes.
   */
  cssVars: Record<ThemeVariant, T>;
}

/**
 * Type guard to check if CSS variables are theme-specific.
 * @param cssVars CSS variables to check
 * @returns True if variables are theme-specific
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
 * Behavior when clicking outside the iframe.
 */
export type WanderEmbeddedClickOutsideBehavior = "auto" | boolean;

/**
 * Configuration options for the iframe.
 */
export interface WanderEmbeddedIframeOptions
  extends WanderEmbeddedComponentOptions<WanderEmbeddedModalCSSVars> {
  // TODO: Default should automatically be used for auth-requests, and auth for account and settings?
  routeLayout?:
    | LayoutType
    | LayoutConfig
    | Partial<Record<RouteType, LayoutType | LayoutConfig>>;

  /**
   * Close Wander Embedded when clicking outside of it:
   *
   * - "auto": Will close if `backdropBackground` is not transparent or if `backdropBackdropFilter` is used.
   * - false: Will never close. Use this if you want Wander Embedded to close by clicking the close icon.
   * - true: Will always close. Use this if you want Wander Embedded to close when clicking outside, even if the
   *   backdrop is not visible.
   */
  clickOutsideBehavior?: WanderEmbeddedClickOutsideBehavior;
}

export interface WanderEmbeddedIframeConfig
  extends WanderEmbeddedComponentConfig<WanderEmbeddedModalCSSVars> {
  routeLayout: Record<RouteType, LayoutConfig>;
  clickOutsideBehavior: WanderEmbeddedClickOutsideBehavior;
}

// Button:

/**
 * Position of the button on the screen.
 */
export type WanderEmbeddedButtonPosition =
  | "top-right"
  | "bottom-right"
  | "top-left"
  | "bottom-left"
  | "static";

/**
 * Position of the popup on the screen
 */
export type WanderEmbeddedPopupPosition =
  | "top-right"
  | "bottom-right"
  | "top-left"
  | "bottom-left";

/**
 * Variant of the Wander logo to display.
 */
export type WanderEmbeddedLogoVariant = "none" | "default" | "text-color";

/**
 * Configuration for balance display in the button.
 */
export interface WanderEmbeddedBalanceOptions {
  /**
   * What balance to display.
   * @param "total" Show total balance
   * @param string Token ID to show specific token balance
   */
  balanceOf: "total" | string;

  /**
   * Currency to display balance in.
   * @param "auto" Use user's selected currency
   * @param string Specific token ID or currency symbol (e.g., "USD")
   */
  currency: "auto" | string;
}

/**
 * Type of notifications to display on the button.
 */
export type WanderEmbeddedButtonNotifications = "off" | "counter" | "alert";

/**
 * Custom labels for button text.
 */
export interface WanderEmbeddedButtonLabels {
  /**
   * Text to display for the sign in action.
   */
  signIn: string;

  /**
   * Text to display for reviewing requests.
   */
  reviewRequests: string;
}

/**
 * Configuration options for the button component.
 */
export interface WanderEmbeddedButtonOptions
  extends WanderEmbeddedComponentOptions<WanderEmbeddedButtonCSSVars> {
  /**
   * Position of the button on the screen.
   * Use "static" for custom positioning via CSS.
   */
  position?: WanderEmbeddedButtonPosition;

  /**
   * Variant of the Wander logo to display.
   */
  wanderLogo?: WanderEmbeddedLogoVariant;

  // TODO: Decide if we want this. Currently hidden, as it doesn't really look good.
  /**
   * URL of the dApp logo that will be displayed next to (overlaid) the Wander logo when connected.
   */
  dappLogoSrc?: string;

  /**
   * Whether to show the button label.
   */
  label?: boolean;

  /**
   * Configuration for displaying balance information.
   */
  balance?: boolean | WanderEmbeddedBalanceOptions;

  /**
   * Type of notifications to display.
   */
  notifications?: WanderEmbeddedButtonNotifications;

  /**
   * Custom labels for button text.
   */
  i18n?: WanderEmbeddedButtonLabels;
}

export interface WanderEmbeddedButtonConfig
  extends WanderEmbeddedComponentConfig<WanderEmbeddedButtonCSSVars> {
  position: WanderEmbeddedButtonPosition;
  wanderLogo: WanderEmbeddedLogoVariant;
  dappLogoSrc: string;
  label: boolean;
  balance: false | WanderEmbeddedBalanceOptions;
  notifications: WanderEmbeddedButtonNotifications;
  i18n: WanderEmbeddedButtonLabels;
}

export type WanderEmbeddedButtonStatus =
  | "isAuthenticated"
  | "isConnected"
  | "isOpen";

// Styles:

/**
 * CSS variables for styling the modal/iframe component.
 */
export interface WanderEmbeddedModalCSSVars {
  // Modal (iframe):
  /**
   * Background color of the modal.
   */
  background: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number | string;

  /**
   * Box shadow of the modal.
   */
  boxShadow: string;
  zIndex: string;
  preferredWidth: number | string;
  preferredHeight: number | string;

  // App wrapper (inside iframe):
  iframePadding: number;
  iframeMaxWidth: number;
  iframeMaxHeight: number;

  // Backdrop (div):
  backdropBackground: string;
  backdropBackdropFilter: string;
  backdropPadding: number | string;

  /**
   * TODO: If `backdropBackground` is transparent and `backdropBackdropFilter` is not set, this will be set to "none", unless
   * a different value is specified. In any other case, this is ignored.
   */
  backdropPointerEvents: string;

  // Mobile specific styles
  mobilePadding: number;
  mobileHeight: string | number;
  mobileBorderRadius: number;
  mobileBorderWidth: number;
  mobileBorderColor: string;
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
   */
  gapX: number | string;

  /**
   * Vertical gap from the edge of the screen.
   * Not used when position is "static".
   */
  gapY: number | string;

  /**
   * Gap between elements inside the button.
   */
  gapInside: number | string;

  /**
   * Minimum width of the button.
   */
  minWidth: number | string;

  /**
   * Minimum height of the button.
   */
  minHeight: number | string;

  /**
   * Z-index of the button.
   */
  zIndex: string;

  /**
   * Padding of the button.
   */
  padding: number | string;

  /**
   * Font style of the button.
   */
  font: string;

  // Button (button, affected by :hover & :focus):
  /**
   * Background color of the button.
   */
  background: string;

  /**
   * Text color of the button.
   */
  color: string;

  /**
   * Border width of the button.
   */
  borderWidth: number | string;

  /**
   * Border color of the button.
   */
  borderColor: string;

  /**
   * Border radius of the button.
   */
  borderRadius: number | string;

  /**
   * Box shadow of the button.
   */
  boxShadow: string;

  // TODO: Vars below are not used yet:

  // Logo (img / svg):
  /**
   * Background color of the logo.
   */
  logoBackground: string;

  /**
   * Border width of the logo.
   */
  logoBorderWidth: number | string;

  /**
   * Border color of the logo.
   */
  logoBorderColor: string;

  /**
   * Border radius of the logo.
   */
  logoBorderRadius: number | string;

  // Notifications (span):
  /**
   * Background color of the notifications badge.
   */
  notificationsBackground: string;

  /**
   * Border width of the notifications badge.
   */
  notificationsBorderWidth: number | string;

  /**
   * Border color of the notifications badge.
   */
  notificationsBorderColor: string;

  /**
   * Border radius of the notifications badge.
   */
  notificationsBorderRadius: number | string;

  /**
   * Box shadow of the notifications badge.
   */
  notificationsBoxShadow: string;

  /**
   * Padding of the notifications badge.
   */
  notificationsPadding: number | string;

  // TODO: :hover and :focus specific styling.
}

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
