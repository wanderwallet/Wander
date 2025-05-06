import { AuthProviderType, AuthStatus } from "./message.types";

export const AUTH_TYPES = [
  "PASSKEYS",
  "EMAIL_N_PASSWORD",
  "GOOGLE",
  "FACEBOOK",
  "X",
  "APPLE",
] as const satisfies AuthProviderType[];

export const AUTH_STATUS = [
  "loading",
  "onboarding",
  "authenticated",
  "not-authenticated",
] as const satisfies AuthStatus[];
