import browser, { type Runtime } from "webextension-polyfill";
import { scheduleGatewayUpdate } from "../../../../../gateways/cache";
import { loadTokens } from "../../../../../tokens/token";
import { ExtensionStorage } from "../../../../../utils/storage/storage";
import { openOrSelectWelcomePage } from "../../../../../wallets/wallets.utils";
import { handleGatewayUpdateAlarm } from "../../alarms/gateway-update/gateway-update-alarm.handler";
import { resetAllPermissions } from "./permissions.handler";
import { initializeARBalanceMonitor } from "../../../../../utils/analytics/analytics";
import { scheduleFairLaunchTokensAlarm } from "../../../../../utils/fair-launch/fair-launch.alarms";

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

    const isSplashSeen = Boolean(await ExtensionStorage.get("update_splash_screen_seen"));
    // if this is undefined, set update_splash_screen_seen
    if (!isSplashSeen) {
      // initially set to false
      await ExtensionStorage.set("update_splash_screen_seen", false);
    }

    // remove astro beta access announcement storage key
    ExtensionStorage.remove("astro_beta_access_announcement_shown");

    // remove name service cache
    ExtensionStorage.remove("name_service_cache");

    // create alarm to sync labels every 6 hours
    browser.alarms.create("sync_labels", { delayInMinutes: 1, periodInMinutes: 360 });
  }

  // init monthly AR
  await initializeARBalanceMonitor();

  // initialize alarm to fetch notifications
  browser.alarms.create("notifications", { periodInMinutes: 10 });

  // reset notifications
  // await ExtensionStorage.set("show_announcement", true);

  // initialize alarm to update tokens once a week
  browser.alarms.create("update_ao_tokens", {
    periodInMinutes: 10080,
  });

  // initialize tokens in wallet
  await loadTokens();

  // wayfinder
  await scheduleGatewayUpdate();
  await handleGatewayUpdateAlarm();
  await scheduleFairLaunchTokensAlarm();
}
