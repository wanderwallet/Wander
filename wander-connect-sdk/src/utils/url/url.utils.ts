import { ThemeSetting } from "../../wander-connect.types";

// When the Wander Connect <iframe> is created, its URL will include the following search params:
// - client-id
// - server-base-url
// - origin
//
// The code/functions below run in the context of the SKD, that is, in the domain of the dApp that integrates Wander
// Connect.

// Duplicated in `src/utils/embedded/embedded.utils.ts`:
const PARAM_CLIENT_ID = "client-id";
const PARAM_THEME = "theme";
const PARAM_ANCESTOR_ORIGIN = "ancestor-origin";
const PARAM_HIDE_BE = "hide-be";
const PARAM_SERVER_BASE_URL = "server-base-url";

export interface getWanderConnectAppURL {
  baseURL: string;
  clientId: string;
  theme: ThemeSetting;
  hideBE?: boolean;
  baseServerURL?: string;
}

export function getWanderConnectAppURL({ baseURL, clientId, theme, hideBE, baseServerURL }: getWanderConnectAppURL) {
  const url = new URL(baseURL);
  const { searchParams } = url;

  searchParams.set(PARAM_CLIENT_ID, clientId);
  searchParams.set(PARAM_THEME, theme);
  searchParams.set(PARAM_ANCESTOR_ORIGIN, window.location.origin);

  // Optional:
  if (hideBE) searchParams.set(PARAM_HIDE_BE, "1");
  if (baseServerURL) searchParams.set(PARAM_SERVER_BASE_URL, baseServerURL);

  return url.toString();
}
