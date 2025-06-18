import type { DbSession } from "embed-api";
import type { JwtPayload } from "jwt-decode";
import type { Provider, Session } from "@supabase/supabase-js";
import type { OAuthError } from "~utils/authentication/authentication.utils";

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
  errorCode: OAuthError | string;
  errorDescription?: string;
}

export type OAuthResultMessage = OAuthSuccessMessage | OAuthErrorMessage;
