import { isAddress, isLocalWallet, isSubscriptionType } from "~utils/assertions";
import { getActiveAddress, getActiveKeyfile } from "~wallets";
import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { requestUserAuthorization } from "../../../utils/auth/auth.utils";
import { getSubscriptionData } from "~subscriptions";
import { RecurringPaymentFrequency, type SubscriptionData } from "~subscriptions/subscription";

const background: BackgroundModuleFunction<SubscriptionData> = async (appData, subscriptionData: SubscriptionData) => {
  // validate input
  isAddress(subscriptionData.arweaveAccountAddress);

  isSubscriptionType(subscriptionData);
  const address = await getActiveAddress();

  if (address === subscriptionData.arweaveAccountAddress) {
    throw new Error("Wallet cannot subscribe to its own address");
  }

  // if is hardware wallet
  const decryptedWallet = await getActiveKeyfile(appData);
  isLocalWallet(decryptedWallet);

  // check if subsciption exists
  let subscriptions = await getSubscriptionData(address);

  if (
    subscriptions &&
    subscriptions.find((subscription) => subscription.arweaveAccountAddress === subscriptionData.arweaveAccountAddress)
  ) {
    throw new Error("Account is already subscribed");
  }

  await requestUserAuthorization(
    {
      type: "subscription",
      arweaveAccountAddress: subscriptionData.arweaveAccountAddress,
      applicationName: subscriptionData.applicationName,
      subscriptionName: subscriptionData.subscriptionName,
      subscriptionManagementUrl: subscriptionData.subscriptionManagementUrl,
      subscriptionFeeAmount: subscriptionData.subscriptionFeeAmount,
      recurringPaymentFrequency: subscriptionData.recurringPaymentFrequency,
      nextPaymentDue: subscriptionData.nextPaymentDue,
      subscriptionStartDate: subscriptionData.subscriptionStartDate,
      subscriptionEndDate: subscriptionData.subscriptionEndDate,
      applicationIcon: subscriptionData?.applicationIcon,
    },
    appData,
  );

  subscriptions = await getSubscriptionData(address);
  const subscription = subscriptions.find(
    (subscription) => subscription.arweaveAccountAddress === subscriptionData.arweaveAccountAddress,
  );

  return subscription;
};

export default background;
