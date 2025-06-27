import type { DbSession } from "embed-api";
import type { JwtPayload } from "jwt-decode";
import type { Provider, Session } from "@supabase/supabase-js";
import type { OAuthErrorCode } from "~utils/authentication/authentication.utils";

export type SupabaseJwtSessionData = Omit<DbSession, "id" | "userId">;

export type SupabaseProvider = Extract<Provider, "google" | "facebook" | "twitter" | "apple">;

export interface SupabaseJwtPayload extends JwtPayload {
  session_id: string;
  sessionData: SupabaseJwtSessionData;
  app_metadata: {
    provider: SupabaseProvider | "email";
    providers: (SupabaseProvider | "email")[];
  };
}

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

// TODO: Import from Supabase (should be exported from embed-api):

export interface AuthError extends Error {
  code: string;
  status: number;
}

export function isAuthError(error: unknown): error is AuthError {
  return (
    error instanceof Error &&
    "code" in error &&
    typeof error.code === "string" &&
    "status" in error &&
    typeof error.status === "number"
  );
}
