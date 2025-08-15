import { extractGarItems, pingUpdater } from "~lib/wayfinder";
import { type Alarms } from "webextension-polyfill";
import type { GatewayAddressRegistryItem } from "~gateways/types";
import { RETRY_ALARM, scheduleGatewayUpdate, UPDATE_ALARM, updateGatewayCache } from "~gateways/cache";
import { ARIO } from "@ar.io/sdk/web";

/**
 * Gateway cache update call. Usually called by an alarm,
 * but will also be executed on install.
 */
export async function handleGatewayUpdateAlarm(alarm?: Alarms.Alarm) {
  if (alarm && ![UPDATE_ALARM, RETRY_ALARM].includes(alarm.name)) {
    return;
  }

  let garItemsWithChecks: GatewayAddressRegistryItem[] = [];

  try {
    // fetch cache
    const ario = ARIO.mainnet();

    const gatewaysResult = await ario.getGateways({ sortBy: "operatorStake", sortOrder: "desc", limit: 5 });

    const garItems = extractGarItems(gatewaysResult.items);

    // healtcheck
    await pingUpdater(garItems, (nextGarItemsWithChecks) => {
      garItemsWithChecks = nextGarItemsWithChecks;
    });

    await updateGatewayCache(garItemsWithChecks);
  } catch (err) {
    console.log("err in handle", err);

    // schedule to try again
    await scheduleGatewayUpdate(true);
  }
}
