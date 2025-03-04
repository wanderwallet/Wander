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

// Exporting the router from one repo to another might, in some scenarios, return incorrect types, but it can be fixed
// by also importing the right AppRouter type and overriding the `client` type:
// type TRPCClient = ReturnType<typeof createTRPCProxyClient<AppRouter>>;
// const trpcVanilla = client as TRPCClient;

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
