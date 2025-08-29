import type { Alarms } from "webextension-polyfill";
import { getActiveAddress } from "../../../../../wallets/wallets.utils";
import { addSubscription, getSubscriptionData } from "../../../../../subscriptions";
import { SubscriptionData } from "../../../../../subscriptions/subscription";
import { handleSubscriptionPayment } from "../../../../../subscriptions/payments";

/**
 * + fetch subscription auto withdrawal allowance
 * + process dates of subscriptions
 * + map through subsciptions
 * + activate payments under withdrawal allowance limit
 * + notify user of manual payments
 */

export async function handleSubscriptionsAlarm(alarmInfo?: Alarms.Alarm) {
  if (!alarmInfo?.name.startsWith("subscription-alarm-")) return;

  const prefixLength = "subscription-alarm-".length;
  const subAddress = alarmInfo.name.substring(prefixLength);

  const activeAddress = await getActiveAddress();

  const subscriptionData: SubscriptionData[] = await getSubscriptionData(activeAddress);

  const matchingSubscription = subscriptionData.find((sub) => sub.arweaveAccountAddress === subAddress);

  if (matchingSubscription) {
    const updated = await handleSubscriptionPayment(matchingSubscription);
    await addSubscription(activeAddress, updated);
  }
}
