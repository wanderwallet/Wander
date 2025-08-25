import { getRedirectURL } from "~gateways/ar_protocol";
import { findGateway } from "~gateways/wayfinder";
import browser, { type WebNavigation } from "webextension-polyfill";

/**
 * Handle custom ar:// protocol, using the
 * browser.webNavigation.onBeforeNavigate API.
 *
 * This is based on the issue in ipfs/ipfs-companion:
 * https://github.com/ipfs/ipfs-companion/issues/164#issuecomment-328374052
 *
 * Thank you ar.io for the updated method:
 * https://github.com/ar-io/wayfinder/blob/main/background.js#L13
 */
export async function handleProtocol(details: WebNavigation.OnBeforeNavigateDetailsType) {
  const gateway = await findGateway({
    arns: true,
    ensureStake: true,
  });

  // parse redirect url
  const redirectUrl = getRedirectURL(new URL(details.url), gateway);

  // don't do anything if it is not a protocol call
  if (!redirectUrl) return;

  // update tab
  browser.tabs.update(details.tabId, {
    url: redirectUrl,
  });
}
