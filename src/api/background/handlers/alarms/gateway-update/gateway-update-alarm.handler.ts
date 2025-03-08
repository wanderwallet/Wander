import { extractGarItems, pingUpdater } from "~lib/wayfinder";
import { type Alarms } from "webextension-polyfill";
import { AOProcess } from "~lib/ao";
import { AO_ARNS_PROCESS } from "~lib/arns";
import type {
  GatewayAddressRegistryItem,
  GatewayAddressRegistryItemData,
  PaginatedResult
} from "~gateways/types";
import {
  RETRY_ALARM,
  scheduleGatewayUpdate,
  UPDATE_ALARM,
  updateGatewayCache
} from "~gateways/cache";

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
    const ArIO = new AOProcess({ processId: AO_ARNS_PROCESS });

    const gatewaysResult = await ArIO.read<
      PaginatedResult<GatewayAddressRegistryItemData>
    >({
      tags: [
        { name: "Action", value: "Paginated-Gateways" },
        { name: "Sort-By", value: "operatorStake" },
        { name: "Sort-Order", value: "desc" },
        { name: "Limit", value: "5" }
      ]
    });

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
