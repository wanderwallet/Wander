import type { SupabaseAuthError } from "embed-api";
import {
  isOAuthError,
  isSupabaseAuthError,
  type OAuthError,
  type OAuthErrorMessage,
  type OAuthResultMessage,
  type OAuthSuccessMessage,
} from "./authentication.types";

export const MIN_SUPABASE_PASSWORD_LENGTH = 6 as const;

export enum OAuthErrorCode {
  MISSING_URL = "MISSING_URL",
  OAUTH_TIMEOUT = "OAUTH_TIMEOUT",
  CANNOT_OPEN_POPUP = "CANNOT_OPEN_POPUP",
  INVALID_OAUTH_MESSAGE = "INVALID_OAUTH_MESSAGE",
  CANNOT_CREATE_SESSION = "CANNOT_CREATE_SESSION",
  POPUP_CLOSED = "POPUP_CLOSED",
  POPUP_TIMEOUT = "POPUP_TIMEOUT",
}

const AUTH_ERRORS_BY_CODE: Record<string | OAuthErrorCode, string> = {
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
  over_email_send_rate_limit: "Wait 60 seconds before requesting a new code.",
  otp_disabled: "No account found for this email.",
  // unexpected_failure description = Error+getting+user+email+from+external+provider
  [OAuthErrorCode.MISSING_URL]: "Authentication error. Please, try again.",
  [OAuthErrorCode.OAUTH_TIMEOUT]: "Authentication timeout. Please, try again.",
  [OAuthErrorCode.CANNOT_OPEN_POPUP]: "Could not open authentication popup. Please, try again.",
  [OAuthErrorCode.INVALID_OAUTH_MESSAGE]: "Authentication error. Please, try again.",
  [OAuthErrorCode.CANNOT_CREATE_SESSION]: "Authentication error. Please, try again.",
  [OAuthErrorCode.POPUP_CLOSED]: "Authentication cancelled.",
  [OAuthErrorCode.POPUP_TIMEOUT]: "Authentication timeout. Please, try again.",
};

export function getFriendlyAuthErrorMessage(
  error: Error | SupabaseAuthError | OAuthError,
  defaultErrorMessage?: string,
): string {
  if (process.env.NODE_ENV === "development") console.error("getFriendlyAuthErrorMessage() =", error);

  let errorCode = "";
  let errorDescription = "";

  if (isOAuthError(error)) {
    errorCode = error.cause.errorCode;
    errorDescription = error.cause.errorDescription;
  } else if (isSupabaseAuthError(error)) {
    errorCode = error.code || `${error.status}` || error.name;
    errorDescription = error.message;
  } else {
    errorCode = error.name;
    errorDescription = error.message;
  }

  const mappedErrorMessage = AUTH_ERRORS_BY_CODE[errorCode];

  if (mappedErrorMessage) return mappedErrorMessage;

  // Check if it's a database error from the description (e.g.: "500: Database error"):
  if (errorDescription.includes("Database error")) {
    return "We're experiencing database connectivity issues. Please try again in a few moments.";
  }

  // Check if it's a 500 error from the description (e.g.: "500: Database error"):
  if (errorDescription.startsWith("500:")) {
    return "Our authentication service is temporarily unavailable. Please try again later.";
  }

  return defaultErrorMessage || AUTH_ERRORS_BY_CODE.unknown_error;
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
