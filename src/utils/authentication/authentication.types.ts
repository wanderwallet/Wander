import type { DbSession } from "embed-api";
import type { JwtPayload } from "jwt-decode";
import type { Session } from "@supabase/supabase-js";

export type SupabaseJwtSessionData = Omit<DbSession, "id" | "userId">;

export interface SupabaseJwtPayload extends JwtPayload {
  session_id: string;
  sessionData: SupabaseJwtSessionData;
}

export interface AuthCompleteMessage {
  type: "AUTH_COMPLETE";
  success: boolean;
  session?: Session;
}
