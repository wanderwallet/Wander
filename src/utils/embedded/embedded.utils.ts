import { createSupabaseClient, createTRPCClient } from "embed-api";
import type { TempWalletPromise } from "~utils/embedded/embedded.types";

const FIVE_MINS_IN_MS = 5 * 60 * 1000;

export function isTempWalletPromiseExpired(
  tempWalletPromise: TempWalletPromise
) {
  return Date.now() - tempWalletPromise.createdAt >= FIVE_MINS_IN_MS;
}

const {
  client: trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader
} = createTRPCClient({
  baseURL: "http://localhost:3000"
});

const supabase = createSupabaseClient(
  import.meta.env?.VITE_SUPABASE_URL || "",
  import.meta.env?.VITE_SUPABASE_ANON_KEY || ""
);

export {
  supabase,
  trpcVanilla,
  getAuthTokenHeader,
  setAuthTokenHeader,
  getDeviceNonceHeader,
  setDeviceNonceHeader
};
