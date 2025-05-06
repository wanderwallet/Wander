import type { ModuleAppData } from "~api/background/background-modules";

export const AUTH_POPUP_REQUEST_WAIT_MS = 1000 as const;
export const AUTH_POPUP_REQUEST_ARRIVAL_WINDOW_MS = 1000 as const;
export const AUTH_POPUP_CLOSING_DELAY_MS = process.env.NODE_ENV === "development" ? (5000 as const) : (0 as const);
export const AUTH_POPUP_UNLOCK_REQUEST_TTL_MS = 900000 as const; // 15 min.

export const DEFAULT_MODULE_APP_DATA = {
  tabID: -1,
  url: "",
} as const satisfies ModuleAppData;

// Errors:

export const ERR_MSG_USER_CANCELLED_AUTH = "User cancelled the AuthRequest";
export const ERR_MSG_NO_WALLETS_ADDED = "No wallets added";
export const ERR_MSG_NO_ACTIVE_WALLET = "No active wallet";
export const ERR_MSG_UNLOCK_TIMEOUT = "Unlock request timed out";
export const ERR_MSG_NO_KEY = "No key";
