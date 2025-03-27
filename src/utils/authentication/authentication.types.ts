import type { DbSession } from "embed-api";
import type { JwtPayload } from "jwt-decode";

export type SupabaseJwtSessionData = Omit<DbSession, "id" | "userId">;

export interface SupabaseJwtPayload extends JwtPayload {
  session_id: string;
  sessionData: SupabaseJwtSessionData;
}
