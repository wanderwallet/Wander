import { IS_EMBEDDED_APP } from "./embedded.constants";

const { search = "", ancestorOrigins = [] } = IS_EMBEDDED_APP ? document.location : {};

export const searchParams = new URLSearchParams(search);
export const ancestorOrigin = ancestorOrigins[ancestorOrigins.length - 1];

export function isInsideIframe(): boolean {
  try {
    return window.self !== window.top || !!ancestorOrigin;
  } catch (e) {
    // If we can't access window.top due to cross-origin restrictions,
    // we're definitely in an iframe
    return true;
  }
}

const NODE_ENV = process.env.NODE_ENV || "development";

const EMBEDDED_ENV_VARS_BY_ENV = {
  development: {
    DEFAULT_EMBEDDED_CLIENT_ID: import.meta.env?.VITE_DEV_DEFAULT_EMBEDDED_CLIENT_ID,
    DEFAULT_EMBEDDED_SERVER_BASE_URL: import.meta.env?.VITE_DEV_DEFAULT_EMBEDDED_SERVER_BASE_URL,
  },
  production: {
    DEFAULT_EMBEDDED_CLIENT_ID: import.meta.env?.VITE_PROD_DEFAULT_EMBEDDED_CLIENT_ID,
    DEFAULT_EMBEDDED_SERVER_BASE_URL: import.meta.env?.VITE_PROD_EMBEDDED_SERVER_BASE_URL,
  },
  test: {
    DEFAULT_EMBEDDED_CLIENT_ID: import.meta.env?.VITE_TEST_DEFAULT_EMBEDDED_CLIENT_ID,
    DEFAULT_EMBEDDED_SERVER_BASE_URL: import.meta.env?.VITE_TEST_DEFAULT_EMBEDDED_SERVER_BASE_URL,
  },
} as const;

const EMBEDDED_ENV_VARS = EMBEDDED_ENV_VARS_BY_ENV[NODE_ENV];

if (!EMBEDDED_ENV_VARS) throw new Error(`Missing ENV vars for NODE_ENV = "${NODE_ENV}"`);

// Duplicated in `wander-connect-sdk/src/utils/url/url.utils.ts`:
const PARAM_CLIENT_ID = "client-id";
const PARAM_THEME = "theme";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";
const PARAM_HIDE_BE = "hide-be";
const PARAM_SERVER_BASE_URL = "server-base-url";

export const EMBEDDED_CLIENT_ID = searchParams.get(PARAM_CLIENT_ID) || EMBEDDED_ENV_VARS.DEFAULT_EMBEDDED_CLIENT_ID;

export const EMBEDDED_THEME = searchParams.get(PARAM_THEME) || "system";

export const EMBEDDED_ANCESTOR_ORIGIN = ancestorOrigin || searchParams.get(PARAM_ANCESTOR_ORIGIN);

export const EMBEDDED_HIDE_BE = searchParams.get(PARAM_HIDE_BE) === "1" || false;

export const EMBEDDED_SERVER_BASE_URL =
  searchParams.get(PARAM_SERVER_BASE_URL) || EMBEDDED_ENV_VARS.DEFAULT_EMBEDDED_SERVER_BASE_URL;

// Note: DO NOT use document.referrer here as that will return the "incorrect" value when the user is redirected from
// an auth provider domain to back to Wander Embedded.

export function getEmbeddedAncestorOrigin() {
  return EMBEDDED_ANCESTOR_ORIGIN;
}
