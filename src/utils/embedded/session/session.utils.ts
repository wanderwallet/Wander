import type { AuthProviderType, DbSession, SupabaseJwtPayload, SupabaseSession, SupabaseUser } from "embed-api";
import { jwtDecode } from "jwt-decode";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";
import { getAuthProviderTypeFromSupabaseUser } from "~utils/embedded/utils/messages/embedded-messages.utils";

function verifySessionSync(dbSession: DbSession, decodedSession: SupabaseJwtPayload): void {
  if (process.env.NODE_ENV !== "development") return;

  if (dbSession.deviceNonce !== decodedSession.sessionData.deviceNonce) {
    console.warn(
      `⚠️  The current session's deviceNonce (${dbSession.deviceNonce}) doesn't match the decoded session's deviceNonce (${decodedSession.sessionData.deviceNonce}):`,
      { dbSession, decodedSession },
    );
  }

  if (dbSession.userAgent !== decodedSession.sessionData.userAgent) {
    console.warn(
      `⚠️  The current session's userAgent (${dbSession.userAgent}) doesn't match the decoded session's userAgent (${decodedSession.sessionData.userAgent}):`,
      { dbSession, decodedSession },
    );
  }

  if (dbSession.userId !== decodedSession.sub) {
    console.warn(
      `⚠️  The current session's userId (${dbSession.userId}) doesn't match the decoded session's sub (${decodedSession.sub}):`,
      { dbSession, decodedSession },
    );
  }
}

export interface ParseSupabaseSessionsReturn {
  accessToken: string | null;
  user: SupabaseUser | null;
  authProviderType: AuthProviderType | null;
  session: DbSession | null;
}

export async function parseSupabaseSession(supabaseSession?: SupabaseSession): Promise<ParseSupabaseSessionsReturn> {
  const accessToken = supabaseSession?.access_token ?? null;
  const user = (supabaseSession?.user as SupabaseUser) ?? null;
  const authProviderType = getAuthProviderTypeFromSupabaseUser(user);

  if (process.env.NODE_ENV === "development" && user && authProviderType === null) {
    alert(
      `authProviderType = ${authProviderType}. Something wasn't properly mapped in AUTH_PROVIDER_TYPE_BY_PROVIDER_STR.`,
    );
  }

  if (!accessToken || !user) {
    return {
      accessToken: null,
      user: null,
      authProviderType: null,
      session: null,
    };
  }

  const decodedSession = jwtDecode<SupabaseJwtPayload>(accessToken);
  const { sessionData } = decodedSession;
  const deviceNonce = await getDeviceNonce();
  const userAgent = navigator.userAgent;
  const userId = user.id;
  const session: DbSession = {
    id: decodedSession.session_id,
    createdAt: sessionData.createdAt,
    updatedAt: sessionData.updatedAt,
    deviceNonce,
    ip: sessionData.ip,
    userAgent,
    userId,
  };

  verifySessionSync(session, decodedSession);

  return {
    accessToken,
    user,
    authProviderType,
    session,
  };
}
