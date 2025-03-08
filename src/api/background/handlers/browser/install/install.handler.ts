import { scheduleGatewayUpdate } from "~gateways/cache";
import browser, { type Runtime } from "webextension-polyfill";
import { loadTokens } from "~tokens/token";
import { initializeARBalanceMonitor } from "~utils/analytics";
import { updateAoToken } from "~utils/ao_import";
import { handleGatewayUpdateAlarm } from "~api/background/handlers/alarms/gateway-update/gateway-update-alarm.handler";
import { openOrSelectWelcomePage } from "~wallets";
import { resetAllPermissions } from "~applications/permissions";
import { ExtensionStorage } from "~utils/storage";

/**
 * On extension installed event handler
 */
export async function handleInstall(details: Runtime.OnInstalledDetailsType) {
  // only run on install
  if (details.reason === "install") {
    openOrSelectWelcomePage(true);
  }

  if (details.reason === "update") {
    // reset permissions
    await resetAllPermissions();

    const isSplashSeen = Boolean(
      await ExtensionStorage.get("update_splash_screen_seen")
    );
    // if this is undefined, set update_splash_screen_seen
    if (!isSplashSeen) {
      // initially set to false
      await ExtensionStorage.set("update_splash_screen_seen", false);
    }
  }

  // init monthly AR
  await initializeARBalanceMonitor();

  // initialize alarm to fetch notifications
  browser.alarms.create("notifications", { periodInMinutes: 1 });

  // reset notifications
  // await ExtensionStorage.set("show_announcement", true);

  // initialize alarm to update tokens once a week
  browser.alarms.create("update_ao_tokens", {
    periodInMinutes: 10080
  });

  // initialize tokens in wallet
  await loadTokens();

  // update old ao token to new ao token
  await updateAoToken();

  // wayfinder
  await scheduleGatewayUpdate();
  await handleGatewayUpdateAlarm();
}
