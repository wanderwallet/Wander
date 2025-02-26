import type { DbSession } from "embed-api";

export const IS_EMBEDDED_APP = import.meta.env?.VITE_IS_EMBEDDED_APP === "1";

export const EMBEDDED_FEATURE_FLAGS = {
  STORE_SEED_PHRASE: true
} as const;

// TODO: Replace with the real thing once authentication is implemented...

export const EMPTY_SESSION: DbSession = {
  id: "",
  createdAt: new Date(0),
  updatedAt: new Date(0),
  deviceNonce: "",
  ip: "",
  countryCode: "",
  userAgent: "",
  userId: ""
};
