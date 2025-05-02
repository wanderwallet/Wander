import type { AuthProviderType } from "embed-api";
import type {
  AuthStatus,
  EmbeddedSdkAuthStatus
} from "~utils/embedded/embedded.types";

export const IS_EMBEDDED_APP = import.meta.env?.VITE_IS_EMBEDDED_APP === "1";

export const EMBEDDED_ANCESTOR_TAB_ID = -42;

export const EMBEDDED_IFRAME_TAB_ID = -420;

// TODO: Should these be loaded from the backend or using Vercel's flags?
export const EMBEDDED_FEATURE_FLAGS = {
  STORE_SEED_PHRASE: true,
  STORE_RECOVERY_SHARES: true
} as const;

export const AUTH_PROVIDER_TYPE_BY_PROVIDER_STR = {
  passkeys: "PASSKEYS",
  email: "EMAIL_N_PASSWORD",
  google: "GOOGLE",
  facebook: "FACEBOOK",
  twitter: "X",
  apple: "APPLE"
} as const satisfies Record<string, AuthProviderType>;

export const EMBEDDED_SDK_AUTH_STATUS_BY_AUTH_STATUS = {
  unlocked: "authenticated",
  authLoading: "loading",
  noShares: "onboarding",
  noWallets: "onboarding"
} as const satisfies Partial<Record<AuthStatus, EmbeddedSdkAuthStatus>>;
