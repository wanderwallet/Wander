import type {
  OAuthErrorMessage,
  OAuthResultMessage,
  OAuthSuccessMessage,
  SupabaseProvider,
} from "~utils/authentication/authentication.types";

export enum OAuthError {
  OAUTH_TIMEOUT = "OAUTH_TIMEOUT",
  CANNOT_OPEN_POPUP = "CANNOT_OPEN_POPUP",
  INVALID_OAUTH_MESSAGE = "INVALID_OAUTH_MESSAGE",
  CANNOT_CREATE_SESSION = "CANNOT_CREATE_SESSION",
  POPUP_CLOSED = "POPUP_CLOSED",
  POPUP_TIMEOUT = "POPUP_TIMEOUT",
}

const errorMap: Record<string, string> = {
  server_error:
    "There was a problem connecting to the authentication service. This could be due to network issues or server maintenance.",
  invalid_request:
    "The authentication request was invalid. This might happen if the session expired or required information was missing.",
  access_denied:
    "Access was denied. This usually happens if you declined permissions or the authentication was cancelled.",
  unauthorized_client:
    "This application is not authorized to perform this operation. Please contact support if this persists.",
  invalid_grant: "The authentication credentials were invalid or expired. Please try again with valid credentials.",
  invalid_scope:
    "The requested permissions were invalid or insufficient. Please try again and ensure all required permissions are granted.",
  temporarily_unavailable: "The authentication service is temporarily unavailable. Please try again in a few moments.",
  unknown_error:
    "An unexpected error occurred during authentication. Please try again or contact support if the issue persists.",
  unexpected_failure: "We could not get your email. Please, try a different authentication method.",
  // unexpected_failure description = Error+getting+user+email+from+external+provider
};

export function getFriendlyErrorMessage(error: string, description: string): string {
  // First check if it's a database error from the description
  if (description.includes("Database error")) {
    return "We're experiencing database connectivity issues. Please try again in a few moments.";
  }

  // Check for specific error codes in description (e.g., "500: Database error")
  const errorCode = description.split(":")[0];

  if (errorCode === "500") {
    return "Our authentication service is temporarily unavailable. Please try again later.";
  }

  return errorMap[error] || errorMap.unknown_error;
}

export const OAUTH_SUCCESS_MSG_TYPE = "OAUTH_SUCCESS" as const;

export const OAUTH_ERROR_MSG_TYPE = "OAUTH_ERROR" as const;

export function isOAuthSuccessMessage(msg: OAuthResultMessage): msg is OAuthSuccessMessage {
  return (
    msg.type === OAUTH_SUCCESS_MSG_TYPE &&
    typeof msg.session === "object" &&
    !!msg.session &&
    !!msg.session.access_token &&
    !!msg.session.refresh_token &&
    typeof msg.session.user === "object" &&
    !!msg.session.user
  );
}

export function isOAuthErrorMessage(msg: OAuthResultMessage): msg is OAuthErrorMessage {
  return (
    msg.type === OAUTH_ERROR_MSG_TYPE &&
    typeof msg.errorCode === "string" &&
    !!msg.errorCode &&
    (msg.errorDescription === undefined || typeof msg.errorDescription === "string")
  );
}

/**
 * Interval at which we check whether the auth popup window has been closed.
 */
export const POPUP_CHECK_INTERVAL_MS = 250 as const;

/**
 * Time the user has to authenticate once the auth popup window is opened.
 */
export const POPUP_AUTHENTICATION_TIMEOUT_MS = 300000 as const; // 5 minutes

/**
 * Time the auth popup window will wait for Supabase's onAuth event before
 * sending an error AUTH_COMPLETE message back to the iframe and closing itself.
 */
export const POPUP_ON_AUTH_TIMEOUT_MS = 30000 as const; // 30 seconds

/**
 * Time the auth popup window will wait for a confirmation from the iframe
 * (AUTH_COMPLETE_ACK) after sending a AUTH_COMPLETE message. If it doesn't
 * receive it, it will simply close itself.
 */
export const POPUP_CONFIRMATION_TIMEOUT_MS = 10000 as const; // 10 seconds

/**
 * Background colors used by different OAuth providers in their own UIs.
 */
export const BACKGROUND_COLORS_BY_PROVIDER: Record<SupabaseProvider, [string, string]> = {
  google: ["white", "rgb(14 14 14 / 1)"],
  facebook: ["white", "#1C1C1D"],
  twitter: ["white", "white"],
  apple: ["white", "white"],
};
