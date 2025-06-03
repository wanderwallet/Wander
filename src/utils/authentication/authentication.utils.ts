import type { AuthCompleteMessage } from "~utils/authentication/authentication.types";

export const AUTH_COMPLETE_MSG_TYPE = "AUTH_COMPLETE" as const;

export function isAuthCompleteMessage(msg: unknown): msg is AuthCompleteMessage {
  return (
    (!!msg &&
      (msg as AuthCompleteMessage).type === AUTH_COMPLETE_MSG_TYPE &&
      (msg as AuthCompleteMessage).success === false) ||
    ((msg as AuthCompleteMessage).success === true &&
      typeof (msg as AuthCompleteMessage).session === "object" &&
      !!(msg as AuthCompleteMessage).session &&
      !!(msg as AuthCompleteMessage).session.access_token &&
      !!(msg as AuthCompleteMessage).session.refresh_token &&
      typeof (msg as AuthCompleteMessage).session.user === "object" &&
      !!(msg as AuthCompleteMessage).session.user)
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
