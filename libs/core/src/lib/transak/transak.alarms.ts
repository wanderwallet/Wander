import browser from "webextension-polyfill";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { gql } from "~gateways/api";
import { queryClient } from "~utils/tanstack";
import { defaultOptions } from "check-password-strength";
import { getTagValue } from "~tokens/aoTokens/ao";
import { trackDirect, EventType } from "~utils/analytics";
import { getActiveTier } from "~utils/tier/utils";
import { TRANSAK_SAVINGS_QUERY } from "./transak.queries";
import {
  getTransakPurchaseIds,
  getTransakPurchaseTimestamp,
  setTransakPurchaseIds,
  setTransakPurchaseTimestamp,
} from "./transak.utils";
import { TRANSAK_PURCHASE_ALARM_NAME_PREFIX } from "./transak.constants";
import { getActiveAddress } from "~wallets";
import { getSetting } from "~settings";

let isTransakPurchaseCheckInProgress = false;
const TWO_HOURS_MS = 1000 * 60 * 60 * 2;
const ONE_DAY_MS = 1000 * 60 * 60 * 24;

export async function checkIfTransakPurchaseSucceeded(address: string): Promise<boolean> {
  try {
    log(LOG_GROUP.TRANSAK, "Checking if transak purchase succeeded");

    if (!address) {
      log(LOG_GROUP.TRANSAK, "No address found");
      return;
    }

    const timestamp = await getTransakPurchaseTimestamp(address);
    if (Date.now() > timestamp + TWO_HOURS_MS) {
      await clearTransakPurchaseAlarm(address);
      log(LOG_GROUP.TRANSAK, "Transak purchase check expired");
      return;
    }

    if (isTransakPurchaseCheckInProgress) return;
    isTransakPurchaseCheckInProgress = true;

    const response = await gql(TRANSAK_SAVINGS_QUERY, { wallet: address });
    let edges = response?.data?.transactions?.edges || [];
    const oneDayAgo = Date.now() - ONE_DAY_MS;
    edges = edges.filter((edge) => (edge.node.block?.timestamp || Date.now()) >= oneDayAgo);

    if (edges.length === 0) {
      log(LOG_GROUP.TRANSAK, "No transak purchases found");
      return;
    }

    const transakPurchaseIds = await getTransakPurchaseIds(address);

    const foundTxIds = new Set<string>(transakPurchaseIds);

    const activeTier = await queryClient
      .fetchQuery({
        queryKey: ["active-tier", address],
        queryFn: () => getActiveTier(address),
        ...defaultOptions,
      })
      .catch(() => ({ tier: "" }));

    const trackDirectPromises = edges.map(async (edge) => {
      const tags = edge.node.tags;
      const orderId = getTagValue("Order-Id", tags);

      if (foundTxIds.has(orderId) || !orderId) return;
      foundTxIds.add(orderId);

      const feeAmountUsd = getTagValue("Fee-Applied", tags) || "0";
      const feeSavingsUsd = getTagValue("Fee-Savings", tags) || "0";

      const transactionData = {
        orderId,
        feeAmountUsd,
        feeSavingsUsd,
        tier: activeTier.tier || "",
      };

      try {
        log(LOG_GROUP.TRANSAK, "Tracking transak purchase: ", transactionData);
        return await trackDirect(EventType.BUY_AR_CONFIRM_PURCHASE, transactionData);
      } catch (err) {
        log(LOG_GROUP.TRANSAK, "Error tracking transak purchase: ", err);
        throw err;
      }
    });

    await Promise.allSettled(trackDirectPromises);

    await setTransakPurchaseIds(address, Array.from(foundTxIds));
  } catch {
    log(LOG_GROUP.TRANSAK, "Error checking transak purchases");
  } finally {
    isTransakPurchaseCheckInProgress = false;
  }
}

export async function scheduleTransakPurchaseAlarm(address?: string) {
  try {
    const analyticsEnabled = await getSetting("analytics").getValue();
    if (!analyticsEnabled) return;

    address = address || (await getActiveAddress());
    const alarmName = `${TRANSAK_PURCHASE_ALARM_NAME_PREFIX}${address}`;
    const alarms = await browser.alarms.get(alarmName);
    if (alarms) {
      await browser.alarms.clear(alarmName);
    }

    await setTransakPurchaseTimestamp(address, Date.now());
    browser.alarms.create(alarmName, { delayInMinutes: 5, periodInMinutes: 30 });
  } catch (error) {
    log(LOG_GROUP.TRANSAK, "Error scheduling transak purchase alarm", error);
  }
}

export async function clearTransakPurchaseAlarm(address: string) {
  try {
    const alarmName = `${TRANSAK_PURCHASE_ALARM_NAME_PREFIX}${address}`;
    await browser.alarms.clear(alarmName);
  } catch (error) {
    log(LOG_GROUP.TRANSAK, "Error clearing transak purchase alarm", error);
  }
}
