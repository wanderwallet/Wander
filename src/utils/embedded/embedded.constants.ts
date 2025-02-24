export const IS_EMBEDDED_APP = import.meta.env?.VITE_IS_EMBEDDED_APP === "1";

export const EMBEDDED_FEATURE_FLAGS = {
  STORE_SEED_PHRASE: true
} as const;
