import { EmbeddedAuthProviderType, EmbeddedAuthStatus } from "./message.types";

export const EMBEDDED_AUTH_TYPE = [
  "PASSKEYS",
  "EMAIL_N_PASSWORD",
  "GOOGLE",
  "FACEBOOK",
  "X",
  "APPLE"
] as const satisfies EmbeddedAuthProviderType[];

export const EMBEDDED_AUTH_STATUS = [
  "loading",
  "onboarding",
  "authenticated",
  "not-authenticated"
] as const satisfies EmbeddedAuthStatus[];
