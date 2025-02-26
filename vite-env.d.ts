/// <reference types="vite/client" />

// See https://vite.dev/guide/env-and-mode.html#intellisense-for-typescript

interface ImportMetaEnv {
  readonly VITE_IS_EMBEDDED_APP: "1" | "0";
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env?: ImportMetaEnv;
}
