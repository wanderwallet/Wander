import { IS_EMBEDDED_APP } from "./embedded.constants";

const { search = "", ancestorOrigins = [] } = IS_EMBEDDED_APP
  ? document.location
  : {};

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
