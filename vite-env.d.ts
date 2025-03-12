/// <reference types="vite/client" />

// See https://vite.dev/guide/env-and-mode.html#intellisense-for-typescript

interface ImportMetaEnv {
  readonly VITE_IS_EMBEDDED_APP: "1" | "0";
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;

  // Development build values:
  readonly VITE_DEV_DEFAULT_EMBEDDED_CLIENT_ID: string;
  readonly VITE_DEV_DEFAULT_EMBEDDED_SERVER_BASE_URL: string;

  // Production build values:
  readonly VITE_PROD_DEFAULT_EMBEDDED_CLIENT_ID: string;
  readonly VITE_PROD_EMBEDDED_SERVER_BASE_URL: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
