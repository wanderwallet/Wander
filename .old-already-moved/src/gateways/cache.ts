import browser from "webextension-polyfill";
import type { GatewayAddressRegistryItem } from "~gateways/types";
import { ExtensionStorage } from "~utils/storage";

/** Cache storage name */
export const CACHE_STORAGE_NAME = "gateways";
export const UPDATE_ALARM = "update_gateway";
export const RETRY_ALARM = "update_gateway_retry";

/**
 * Get cache of ar.io gateway list
 */
export async function getGatewayCache() {
  return await ExtensionStorage.get<GatewayAddressRegistryItem[]>(CACHE_STORAGE_NAME);
}

/**
 * Update ar.io gateway list cache
 */
export async function updateGatewayCache(gateways: GatewayAddressRegistryItem[]) {
  return await ExtensionStorage.set(CACHE_STORAGE_NAME, gateways);
}

/**
 * Schedule update to gateway list.
 * Refreshes after one day or if in retry mode,
 * it'll attempt to call the alarm again in an hour.
 */
export async function scheduleGatewayUpdate(retry = false) {
  // return if update alarm has already been scheduled
  const gatewayUpdateAlarm = await browser.alarms.get(UPDATE_ALARM);
  if (!retry && !!gatewayUpdateAlarm) return;

  browser.alarms.create(retry ? RETRY_ALARM : UPDATE_ALARM, {
    [retry ? "when" : "periodInMinutes"]: retry ? Date.now() + 60 * 60 * 1000 : 12 * 60,
  });
}
