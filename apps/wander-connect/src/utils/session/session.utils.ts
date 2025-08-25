import {
  createAnonSession as createAnonSessionFromHeaders,
  type AuthProviderType,
  type DbSession,
  type SupabaseJwtPayload,
  type SupabaseSession,
  type SupabaseUser,
} from "embed-api";
import { jwtDecode } from "jwt-decode";
import { getDeviceNonce } from "~utils/_embedded/device-nonce/device-nonce.utils";
import { getSupabaseClient } from "~utils/_embedded/embedded.utils";
import { getAuthProviderTypeFromSupabaseUser } from "~utils/_embedded/utils/messages/embedded-messages.utils";

let hasSessionBeenRefreshed = false;

async function verifySessionSync(dbSession: DbSession, decodedSession: SupabaseJwtPayload): Promise<void> {
  let shouldRefreshSession = false;

  if (dbSession.deviceNonce !== decodedSession.sessionData.deviceNonce) {
    shouldRefreshSession = true;

    if (process.env.NODE_ENV === "development")
      console.warn(
        `⚠️  The current session's deviceNonce (${dbSession.deviceNonce}) doesn't match the decoded session's deviceNonce (${decodedSession.sessionData.deviceNonce}):`,
        { dbSession, decodedSession },
      );
  }

  if (dbSession.userAgent !== decodedSession.sessionData.userAgent) {
    shouldRefreshSession = true;

    if (process.env.NODE_ENV === "development")
      console.warn(
        `⚠️  The current session's userAgent (${dbSession.userAgent}) doesn't match the decoded session's userAgent (${decodedSession.sessionData.userAgent}):`,
        { dbSession, decodedSession },
      );
  }

  if (dbSession.userId !== decodedSession.sub) {
    shouldRefreshSession = true;

    if (process.env.NODE_ENV === "development")
      console.warn(
        `⚠️  The current session's userId (${dbSession.userId}) doesn't match the decoded session's sub (${decodedSession.sub}):`,
        { dbSession, decodedSession },
      );
  }

  if (!shouldRefreshSession && process.env.NODE_ENV === "development") {
    console.info(`✅  The current session's matches the decoded session:`, { dbSession, decodedSession });
  }

  if (shouldRefreshSession && !hasSessionBeenRefreshed) {
    hasSessionBeenRefreshed = true;

    if (process.env.NODE_ENV === "development") console.info("🔁  Refreshing session...");

    try {
      const supabase = await getSupabaseClient();
      const refreshedSessionResponse = await supabase.auth.refreshSession();

      if (process.env.NODE_ENV === "development") console.info("🔁  Refreshed session =", refreshedSessionResponse);
    } catch (err) {
      console.warn("Error refreshing session:", err);
    }
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
    const anonSession = await createAnonSession();

    return {
      accessToken: null,
      user: null,
      authProviderType: null,
      session: anonSession,
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

export const INITIAL_ANON_SESSION = createAnonSessionFromHeaders({
  userAgent: navigator.userAgent,
  deviceNonce: "",
  ip: "",
});

export async function createAnonSession() {
  const deviceNonce = await getDeviceNonce();
  const userAgent = navigator.userAgent;

  return createAnonSessionFromHeaders({
    userAgent,
    deviceNonce,
    ip: "",
  });
}
