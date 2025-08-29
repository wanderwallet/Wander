import { AuthStatus } from "../../wander-connect.types";

// Currently not used (for message validation) so that we can add additional providers without releasing a new SDK version:
// export const AUTH_TYPES = [
//   "PASSKEYS",
//   "EMAIL_N_PASSWORD",
//   "GOOGLE",
//   "FACEBOOK",
//   "X",
//   "APPLE",
// ] as const satisfies AuthProviderType[];

export const AUTH_STATUS = [
  "loading",
  "onboarding",
  "authenticated",
  "not-authenticated",
] as const satisfies AuthStatus[];
