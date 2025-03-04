import type { AuthProviderType } from "embed-api";

export const IS_EMBEDDED_APP = import.meta.env?.VITE_IS_EMBEDDED_APP === "1";

// TODO: Should these be loaded from the backend or using Vercel's flags?
export const EMBEDDED_FEATURE_FLAGS = {
  STORE_SEED_PHRASE: true
} as const;

export const AUTH_PROVIDER_TYPE_BY_PROVIDER_STR = {
  passkeys: "PASSKEYS",
  email: "EMAIL_N_PASSWORD",
  google: "GOOGLE",
  facebook: "FACEBOOK",
  x: "X",
  apple: "APPLE"
} as const satisfies Record<string, AuthProviderType>;
