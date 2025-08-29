import { EventType, trackEvent } from "~utils/analytics";
import { RecurringPaymentFrequency, SubscriptionStatus, type SubscriptionData } from "./subscription";
import { ExtensionStorage } from "~utils/storage";

// get subscription data from storage
export async function getSubscriptionData(activeAddress: string): Promise<SubscriptionData[]> {
  try {
    const subscriptionData = await ExtensionStorage.get<SubscriptionData[]>(`subscriptions_${activeAddress}`);
    return subscriptionData || [];
  } catch (err) {
    console.log("Error getting subscription data:", err);
    return [];
  }
}

export async function deleteSubscription(activeAddress: string, deleteId: string) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === deleteId,
    );

    if (subscriptionIndex !== -1) {
      subscriptions.splice(subscriptionIndex, 1);

      await ExtensionStorage.set(`subscriptions_${activeAddress}`, subscriptions);
    } else {
      console.log("No subscription found with the given ID");
    }
  } catch (err) {
    console.log("Error deleting subscription:", err);
  }
}

export function calculateNextPaymentDate(
  currentNextPaymentDue: Date | string,
  recurringPaymentFrequency: RecurringPaymentFrequency,
): { currentDate: Date; status: "success" | "fail" } {
  const currentDate =
    typeof currentNextPaymentDue === "string" ? new Date(currentNextPaymentDue) : currentNextPaymentDue;

  switch (recurringPaymentFrequency) {
    // case RecurringPaymentFrequency.ANNUALLY:
    //   currentDate.setFullYear(currentDate.getFullYear() + 1);
    //   break;
    case RecurringPaymentFrequency.QUARTERLY:
      currentDate.setMonth(currentDate.getMonth() + 3);
      break;
    case RecurringPaymentFrequency.MONTHLY:
      currentDate.setMonth(currentDate.getMonth() + 1);
      break;
    case RecurringPaymentFrequency.WEEKLY:
      currentDate.setDate(currentDate.getDate() + 7);
      break;
    // case RecurringPaymentFrequency.EVERY_5_MINUTES:
    //   currentDate.setMinutes(currentDate.getMinutes() + 5);
    //   break;
    // case RecurringPaymentFrequency.HOURLY:
    //   currentDate.setHours(currentDate.getHours() + 1);
    //   break;

    case RecurringPaymentFrequency.DAILY:
      currentDate.setDate(currentDate.getDate() + 1);
      break;
    default:
      console.error("Invalid recurring payment frequency");
      return { currentDate, status: "fail" };
  }

  return { currentDate, status: "success" };
}

export async function updateAutoRenewal(autoRenewal: boolean, activeAddress: string, updateId: string) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === updateId,
    );
    if (subscriptionIndex !== -1) {
      subscriptions[subscriptionIndex].applicationAutoRenewal = autoRenewal;
      await ExtensionStorage.set(`subscriptions_${activeAddress}`, subscriptions);
    }
  } catch (err) {}
}

export async function updateAllowance(newAllowance: number, activeAddress: string, updateId: string) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === updateId,
    );
    if (subscriptionIndex !== -1) {
      subscriptions[subscriptionIndex].applicationAllowance = newAllowance;
      await ExtensionStorage.set(`subscriptions_${activeAddress}`, subscriptions);
    }
  } catch (err) {
    console.error("Error updating allowance:", err);
  }
}

export async function updateSubscription(
  activeAddress: string,
  updateId: string,
  newStatus: SubscriptionStatus,
  nextPaymentDue?: Date | string,
) {
  try {
    const subscriptions = await getSubscriptionData(activeAddress);
    const subscriptionIndex = subscriptions.findIndex(
      (subscription) => subscription.arweaveAccountAddress === updateId,
    );
    if (subscriptionIndex !== -1) {
      if (nextPaymentDue !== undefined) {
        // update nextPaymentDue
        subscriptions[subscriptionIndex].nextPaymentDue = nextPaymentDue;
      }

      // This is here to prevent transactions from going through if for some reason alarm wasn't deleted
      if (subscriptions[subscriptionIndex].subscriptionStatus === SubscriptionStatus.CANCELED) {
        return;
      } else {
        // update status
        subscriptions[subscriptionIndex].subscriptionStatus = newStatus;
      }

      await ExtensionStorage.set(`subscriptions_${activeAddress}`, subscriptions);
    } else {
      console.log("No subscription found with the given ID");
    }
  } catch (err) {
    console.log("err", err);
  }
}

export async function addSubscription(activeAddress: string, newSubscription: SubscriptionData) {
  // get existing subs
  try {
    const subscriptions = (await getSubscriptionData(activeAddress)) || [];
    const existingIndex = subscriptions.findIndex(
      (sub) => sub.arweaveAccountAddress === newSubscription.arweaveAccountAddress,
    );

    if (existingIndex !== -1) {
      subscriptions[existingIndex] = newSubscription;
    } else {
      subscriptions.push(newSubscription);
    }
    await ExtensionStorage.set(`subscriptions_${activeAddress}`, subscriptions);
  } catch (err) {
    console.error("error saving subscription", err);
  }
}

// get subscription auto withdrawal allowance
export async function getAutoAllowance(): Promise<number> {
  const subscriptionAllowance = await ExtensionStorage.get<number>("setting_subscription_allowance");
  return subscriptionAllowance;
}

export async function trackCanceledSubscription(data: SubscriptionData, autoCanceled: boolean) {
  await trackEvent(EventType.UNSUBSCRIBED, {
    applicationName: data.applicationName,
    arweaveAccountAddress: data.arweaveAccountAddress,
    recurringPaymentFrequency: data.recurringPaymentFrequency,
    subscriptionFeeAmount: data.subscriptionFeeAmount,
    autoPay: data.applicationAllowance !== 0,
    autoRenewal: data.applicationAutoRenewal,
    autoCanceled,
  });
}
