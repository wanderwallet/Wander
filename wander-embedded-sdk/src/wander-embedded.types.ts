import { UserDetails } from "./utils/message/message.types";

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
  /* Settings and preferences screen */
  | "settings"
  /** Authorization request screen for approving transactions. */
  | "auth-request";

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
  imgSrc?: string;

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
  imgSrc?: string;
}

/** User's wallet balance information */
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

/** Main configuration options for the Wander Embedded SDK */
export interface WanderEmbeddedOptions {
  /**
   * Client ID for your App, registered on the Wander Dashboard.
   * @required
   */
  clientId: string;

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
   * @default "https://embed-api.wander.app"
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
  onRequest?: (pendingRequests: number) => void;
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
 * Behavior when clicking outside the iframe.
 * Controls how the iframe responds when users click outside of it.
 */
export type WanderEmbeddedClickOutsideBehavior = "auto" | boolean;

/**
 * Configuration options for the iframe.
 * Customizes the appearance and behavior of the Wander Embedded iframe,
 * which displays the wallet UI.
 */
export interface WanderEmbeddedIframeOptions
  extends WanderEmbeddedComponentOptions<WanderEmbeddedModalCSSVars> {
  // TODO: Default should automatically be used for auth-requests, and auth for account and settings?
  /**
   * Layout configuration for different routes.
   * Controls how the iframe is displayed for each route type.
   * Can be a single layout type/config applied to all routes or a map of specific layouts per route type.
   */
  routeLayout?:
    | LayoutType
    | LayoutConfig
    | Partial<Record<RouteType, LayoutType | LayoutConfig>>;

  /**
   * Close Wander Embedded when clicking outside of it.
   * Controls the behavior when a user clicks outside the iframe:
   * - "auto": Will close if `backdropBackground` is not transparent or if `backdropBackdropFilter` is used.
   * - false: Will never close. The user must click the close icon.
   * - true: Will always close when clicking outside, even if the backdrop is not visible.
   */
  clickOutsideBehavior?: WanderEmbeddedClickOutsideBehavior;
}

/**
 * Configuration for the iframe component.
 */
export interface WanderEmbeddedIframeConfig
  extends WanderEmbeddedComponentConfig<WanderEmbeddedModalCSSVars> {
  /**
   * Layout configuration for all route types.
   * Complete mapping of route types to their layout configuration.
   */
  routeLayout: Record<RouteType, LayoutConfig>;

  /**
   * Behavior when clicking outside the iframe.
   * How the component responds to clicks outside its boundaries.
   */
  clickOutsideBehavior: WanderEmbeddedClickOutsideBehavior;
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
   * Text to display for the sign in button.
   * @default "Sign In"
   */
  signIn: string;

  /**
   * Text to display for reviewing requests button.
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
   * Position of the button on the screen.
   * Use "static" for custom positioning via CSS.
   */
  position?: WanderEmbeddedButtonPosition;

  /**
   * Variant of the Wander logo to display.
   * - "none": No logo is displayed
   * - "default": Standard Wander logo is displayed
   * - "text-color": Logo with colored text is displayed
   */
  wanderLogo?: WanderEmbeddedLogoVariant;

  /**
   * URL of the dApp logo that will be displayed next to the Wander logo when connected.
   */
  dappLogoSrc?: string;

  /**
   * Whether to show the button label.
   */
  label?: boolean;

  /**
   * Configuration for displaying balance information.
   * - false: No balance is displayed
   * - true: Balance is displayed
   * - WanderEmbeddedBalanceOptions: Customized balance display
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

/**
 * Configuration for the button component.
 */
export interface WanderEmbeddedButtonConfig
  extends WanderEmbeddedComponentConfig<WanderEmbeddedButtonCSSVars> {
  /**
   * Position of the button on the screen.
   */
  position: WanderEmbeddedButtonPosition;

  /**
   * Variant of the Wander logo to display.
   */
  wanderLogo: WanderEmbeddedLogoVariant;

  /**
   * URL of the dApp logo.
   */
  dappLogoSrc: string;

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
  /** Whether the user is authenticated. */
  | "isAuthenticated"
  /** Whether the user's wallet is connected to the application. */
  | "isConnected"
  /** Whether the wallet UI is currently open. */
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

  // App wrapper (inside iframe):
  /**
   * Padding inside the iframe.
   */
  iframePadding: number;

  /**
   * Maximum width of the iframe content.
   */
  iframeMaxWidth: number;

  /**
   * Maximum height of the iframe content.
   */
  iframeMaxHeight: number;

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

  // TODO: If `backdropBackground` is transparent and `backdropBackdropFilter` is not set, this will be set to "none", unless
  // a different value is specified. In any other case, this is ignored.
  /**
   * Pointer events setting for the backdrop.
   */
  backdropPointerEvents: string;

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
