import { UserDetails } from "./utils/message/message.types";

export type RouteType =
  | "default"
  | "auth"
  | "account"
  | "settings"
  | "auth-request";

export interface ModalLayoutConfig {
  type: "modal";
  fixedWidth?: number;
  fixedHeight?: number;
  expandOnMobile?: boolean;
}

export interface PopupLayoutConfig {
  type: "popup";
  position?: WanderEmbeddedButtonPosition;
  fixedWidth?: number;
  fixedHeight?: number;
  expandOnMobile?: boolean;
}

export interface SidebarLayoutConfig {
  type: "sidebar";
  position?: "left" | "right";
  expanded?: boolean;
  fixedWidth?: number;
  expandOnMobile?: boolean;
}

export interface HalfLayoutConfig {
  type: "half";
  position?: "left" | "right";
  expanded?: boolean;
  imgSrc?: string | boolean;
  expandOnMobile?: boolean;
}

export type LayoutConfig =
  | ModalLayoutConfig
  | PopupLayoutConfig
  | SidebarLayoutConfig
  | HalfLayoutConfig;

export type LayoutType = LayoutConfig["type"];

export const LAYOUT_TYPES = [
  "modal",
  "popup",
  "sidebar",
  "half"
] as const satisfies LayoutType[];

export function isRouteConfig(obj: unknown): obj is LayoutConfig {
  return !!(
    obj &&
    typeof obj === "object" &&
    "type" in obj &&
    LAYOUT_TYPES.includes(obj.type as LayoutType)
  );
}

export interface RouteConfig {
  routeType: RouteType;
  preferredLayoutType: LayoutType;
  width?: number;
  height: number;
}

export interface BalanceInfo {
  amount: number;
  currency: "USD" | "EUR"; // TODO: Replace with a type that includes all options in the settings?
}

export interface WanderEmbeddedOptions {
  src?: string;
  iframe?: WanderEmbeddedIframeOptions | HTMLIFrameElement;
  button?: WanderEmbeddedButtonOptions | boolean;

  // TODO: Also export the param types:
  onAuth?: (userDetails: UserDetails | null) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onResize?: (routeConfig: RouteConfig) => void;
  onBalance?: (balanceInfo: BalanceInfo) => void;
  onRequest?: (pendingRequests: number) => void;

  clientId: string;
  applicationId: string;
}

// Common:

export type ThemeVariant = "light" | "dark";

export type ThemeSetting = "system" | ThemeVariant;

export interface WanderEmbeddedComponentOptions<T> {
  id?: string;
  theme?: ThemeSetting;
  cssVars?: Partial<T> | Partial<Record<ThemeVariant, Partial<T>>>;
  customStyles?: string;
}

export interface WanderEmbeddedComponentConfig<T>
  extends Required<WanderEmbeddedComponentOptions<T>> {
  cssVars: Record<ThemeVariant, T>;
}

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

export type WanderEmbeddedClickOutsideBehavior = "auto" | boolean;

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

export type WanderEmbeddedButtonPosition =
  | "top-right"
  | "bottom-right"
  | "top-left"
  | "bottom-left";

export type WanderEmbeddedLogoVariant = "none" | "default" | "text-color";

export interface WanderEmbeddedBalanceOptions {
  balanceOf: "total" | string; // string would be a token id
  currency: "auto" | string; // "auto" would be the one the user selected on the wallet, string would be a token id or currency symbol (e.g. USD).
}

export type WanderEmbeddedButtonNotifications = "off" | "counter" | "alert";

export interface WanderEmbeddedButtonLabels {
  signIn: string;
  reviewRequests: string;
}

export interface WanderEmbeddedButtonOptions
  extends WanderEmbeddedComponentOptions<WanderEmbeddedButtonCSSVars> {
  position?: WanderEmbeddedButtonPosition;
  wanderLogo?: WanderEmbeddedLogoVariant;
  /**
   * TODO: Decide if we want this. Currently hidden, as it doesn't really look good.
   * URL of the dApp logo that will be displayed next to (overlaid) the Wander logo when connected.
   */
  dappLogoSrc?: string;
  label?: boolean;
  balance?: boolean | WanderEmbeddedBalanceOptions;
  notifications?: WanderEmbeddedButtonNotifications;
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

export interface WanderEmbeddedModalCSSVars {
  // Modal (iframe):
  background: string;
  borderWidth: number;
  borderColor: string;
  borderRadius: number | string;
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

export interface WanderEmbeddedButtonCSSVars {
  // Button (button):
  gapX: number | string;
  gapY: number | string;
  gapInside: number | string;
  minWidth: number | string;
  minHeight: number | string;
  zIndex: string;
  padding: number | string;
  font: string;

  // Button (button, affected by :hover & :focus):
  background: string;
  color: string;
  borderWidth: number | string;
  borderColor: string;
  borderRadius: number | string;
  boxShadow: string;

  // TODO: Vars below are not used yet:

  // Logo (img / svg):
  logoBackground: string;
  logoBorderWidth: number | string;
  logoBorderColor: string;
  logoBorderRadius: number | string;

  // Notifications (span):
  notificationsBackground: string;
  notificationsBorderWidth: number | string;
  notificationsBorderColor: string;
  notificationsBorderRadius: number | string;
  notificationsBoxShadow: string;
  notificationsPadding: number | string;

  // TODO: :hover and :focus specific styling.
}
