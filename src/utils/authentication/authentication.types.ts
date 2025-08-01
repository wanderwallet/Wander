import type { SupabaseAuthError } from "embed-api";
import type { Session } from "@supabase/supabase-js";
import type { OAuthErrorCode } from "~utils/authentication/authentication.utils";

export interface OAuthSuccessMessage {
  type: "OAUTH_SUCCESS";
  session: Session;
}

export interface OAuthErrorMessage {
  type: "OAUTH_ERROR";
  errorCode: OAuthErrorCode | string;
  errorDescription?: string;
}

export type OAuthResultMessage = OAuthSuccessMessage | OAuthErrorMessage;

export interface OAuthError extends Error {
  cause: OAuthErrorMessage;
}

export function isOAuthError(error: unknown): error is OAuthError {
  if (!error || typeof error !== "object" || !("cause" in error)) return false;

  const { cause } = error;

  return (
    !!cause &&
    typeof cause === "object" &&
    "type" in cause &&
    cause.type === "OAUTH_ERROR" &&
    "errorCode" in cause &&
    typeof cause.errorCode === "string" &&
    (typeof (cause as OAuthErrorMessage).errorDescription === "undefined" ||
      typeof (cause as OAuthErrorMessage).errorDescription === "string")
  );
}

export function isSupabaseAuthError(error: unknown): error is SupabaseAuthError {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    "status" in error &&
    typeof error.status === "number"
  );
}
