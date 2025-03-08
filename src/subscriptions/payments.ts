import { ExtensionStorage, type RawStoredTransfer } from "~utils/storage";
import type Transaction from "arweave/web/lib/transaction";
import { EventType, trackEvent } from "~utils/analytics";
import { SubscriptionStatus, type SubscriptionData } from "./subscription";
import { findGateway } from "~gateways/wayfinder";
import { getActiveKeyfile } from "~wallets";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import { freeDecryptedWallet } from "~wallets/encryption";
import { fractionedToBalance } from "~tokens/currency";
import { arPlaceholder } from "~routes/popup/send";
import {
  calculateNextPaymentDate,
  updateSubscription as statusUpdateSubscription,
  trackCanceledSubscription
} from "~subscriptions";
import { isLocalWallet } from "~utils/assertions";
import BigNumber from "bignumber.js";

export async function handleSubscriptionPayment(
  data: SubscriptionData,
  initialPayment?: boolean
): Promise<SubscriptionData | null> {
  const activeAddress: string = await ExtensionStorage.get("active_address");

  if (data.subscriptionStatus === SubscriptionStatus.CANCELED) {
    throw new Error("Subscription canceled.");
  }

  if (
    BigNumber(data.applicationAllowance).lt(data.subscriptionFeeAmount) &&
    !initialPayment
  ) {
    await statusUpdateSubscription(
      activeAddress,
      data.arweaveAccountAddress,
      SubscriptionStatus.AWAITING_PAYMENT
    );
    throw new Error("Subscription fee amount exceeds allowance.");
  }

  // disable if payment is past due by a week
  const now = new Date();
  const nextPaymentDue = new Date(data.nextPaymentDue);
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  if (now.getTime() > nextPaymentDue.getTime() + oneWeek) {
    await statusUpdateSubscription(
      activeAddress,
      data.arweaveAccountAddress,
      SubscriptionStatus.CANCELED
    );
    await trackCanceledSubscription(data, true);
    throw new Error("Payment is overdue by more than a week.");
  }

  try {
    const recipientAddress = data.arweaveAccountAddress;
    const prepared = await prepare(recipientAddress, data, activeAddress);
    return send(activeAddress, prepared, data);
  } catch (error) {
    console.log(error);
    throw new Error("Error making auto subscription payment");
  }
}

export const prepare = async (
  target: string,
  data: SubscriptionData,
  activeAddress: string
): Promise<RawStoredTransfer> => {
  try {
    // grab address

    // create tx
    const gateway = await findGateway({});
    const arweave = new Arweave(gateway);

    const winstonBalance = await arweave.wallets.getBalance(activeAddress);

    const balance = arweave.ar.winstonToAr(winstonBalance);

    // Check if the subscription fee exceeds the user's balance
    if (BigNumber(data.subscriptionFeeAmount).gt(balance)) {
      throw new Error("Subscription fee amount exceeds wallet balance");
    }

    // save tx json into session
    // to be signed and submitted
    const formattedTxn: RawStoredTransfer = {
      type: "native",
      gateway: gateway,
      transaction: {} as ReturnType<Transaction["toJSON"]>
    };

    // convert to winston
    const paymentQuantity = fractionedToBalance(
      data.subscriptionFeeAmount.toString(),
      arPlaceholder,
      "AR"
    ).toString();

    const tx = await arweave.createTransaction({
      target,
      quantity: paymentQuantity,
      data: undefined
    });

    // console.log("created tx:", tx);

    tx.addTag("Subscription-Name", data.subscriptionName);
    tx.addTag("App-Name", data.applicationName);
    tx.addTag("Type", "Transfer");
    tx.addTag("Client", "Wander");
    tx.addTag("Client-Version", browser.runtime.getManifest().version);

    formattedTxn.transaction = tx.toJSON();

    return formattedTxn;
  } catch (error) {
    console.log("Error sending automated transaction");
  }
};

export const send = async (
  activeAddress: string,
  formattedTxn: RawStoredTransfer,
  subscriptionData: SubscriptionData,
  manualPayment: boolean = false
): Promise<SubscriptionData | undefined> => {
  // get tx and gateway
  let { gateway, transaction } = formattedTxn;
  const arweave = new Arweave(gateway);
  const unRaw = arweave.transactions.fromRaw(transaction);

  const decryptedWallet = await getActiveKeyfile();

  isLocalWallet(decryptedWallet);
  // Decrypt wallet & sign for user
  const keyfile = decryptedWallet.keyfile;

  // Process transaction without user signing
  try {
    // Set owner
    unRaw.setOwner(keyfile.n);

    // Sign the transaction
    await arweave.transactions.sign(unRaw, keyfile);

    try {
      // Post the transaction
      const submitted = await submitTx(
        activeAddress,
        unRaw,
        arweave,
        subscriptionData,
        manualPayment
      );
      freeDecryptedWallet(keyfile);
      return submitted;
    } catch (e) {
      console.log("entered fallback gateway");
      // FALLBACK IF ISP BLOCKS the gateway or if the gateway fails
      gateway = await findGateway({ random: true });
      const fallbackArweave = new Arweave(gateway);
      await fallbackArweave.transactions.sign(unRaw, keyfile);
      const submitted = await submitTx(
        activeAddress,
        unRaw,
        fallbackArweave,
        subscriptionData,
        manualPayment
      );
      freeDecryptedWallet(keyfile);
      await trackEvent(EventType.FALLBACK, {});
      return submitted;
    }
  } catch (e) {
    console.log(e, "failed subscription tx");
    freeDecryptedWallet(keyfile);
  }
};

const submitTx = async (
  activeAddress: string,
  transaction: Transaction,
  arweave: Arweave,
  data: SubscriptionData,
  manualPayment: boolean = false
): Promise<SubscriptionData | undefined> => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(
        new Error("Timeout: Posting to Arweave took more than 10 seconds")
      );
    }, 10000);
  });
  try {
    await Promise.race([
      arweave.transactions.post(transaction),
      timeoutPromise
    ]);
    const updatedSub = updateSubscriptionAlarm(
      activeAddress,
      data,
      transaction.id,
      manualPayment
    );
    await trackEvent(EventType.SUBSCRIPTION_PAYMENT, {
      amount: data.subscriptionFeeAmount,
      autoPay: data.applicationAllowance !== 0,
      success: true
    });
    return updatedSub;
  } catch (err) {
    // SEGMENT
    await trackEvent(EventType.TRANSACTION_INCOMPLETE, {});
    await trackEvent(EventType.SUBSCRIPTION_PAYMENT, {
      amount: data.subscriptionFeeAmount,
      autoPay: data.applicationAllowance !== 0,
      success: false
    });
    throw new Error("Error posting subscription tx to Arweave");
  }
};

/**
 * Updates a subscription by clearing existing alarms and scheduling the next payment alarm.
 *
 * @param data - The current subscription data.
 * @param updatedTxnId - The transaction ID of the latest payment.
 * @param manualPayment - A flag indicating whether the payment is manual (default: false).
 *
 * @returns The updated subscription data.
 *
 * This function performs the following operations:
 * 1. Calculates the next payment due date based on whether the payment is manual or automatic.
 * 2. Clears the existing subscription alarm if the subscription end date is reached or if the calculation fails.
 * 3. Creates a new alarm for the next payment due date if the subscription is still active.
 * 4. Adds the latest payment transaction to the payment history.
 * 5. Updates the next payment due date in the subscription data.
 */

export async function updateSubscriptionAlarm(
  activeAddress: string,
  data: SubscriptionData,
  updatedTxnId: string,
  manualPayment: boolean = false
): Promise<SubscriptionData> {
  let nextPaymentDue: { currentDate: Date; status: "success" | "fail" };

  if (manualPayment) {
    nextPaymentDue = calculateNextPaymentDate(
      new Date(),
      data.recurringPaymentFrequency
    );
  } else
    nextPaymentDue = calculateNextPaymentDate(
      data.nextPaymentDue,
      data.recurringPaymentFrequency
    );

  if (
    (new Date(data.subscriptionEndDate) <= nextPaymentDue.currentDate &&
      !data.applicationAutoRenewal) ||
    nextPaymentDue.status === "fail"
  ) {
    browser.alarms.clear(`subscription-alarm-${data.arweaveAccountAddress}`);
    await statusUpdateSubscription(
      activeAddress,
      data.arweaveAccountAddress,
      SubscriptionStatus.CANCELED
    );
    await trackCanceledSubscription(data, true);
  } else if (
    new Date(data.subscriptionEndDate) <= nextPaymentDue.currentDate &&
    data.applicationAutoRenewal
  ) {
    // Calculate the time frame between subscriptionStartDate and subscriptionEndDate
    const startDate = new Date(data.subscriptionStartDate);
    const endDate = new Date(data.subscriptionEndDate);
    const timeFrame = endDate.getTime() - startDate.getTime();

    // Calculate the new subscriptionEndDate
    const newEndDate = new Date(endDate.getTime() + timeFrame);
    data.subscriptionEndDate = newEndDate.toISOString();

    browser.alarms.create(`subscription-alarm-${data.arweaveAccountAddress}`, {
      when: nextPaymentDue.currentDate.getTime()
    });
  } else {
    browser.alarms.create(`subscription-alarm-${data.arweaveAccountAddress}`, {
      when: nextPaymentDue.currentDate.getTime()
    });
  }

  if (!data.paymentHistory) {
    data.paymentHistory = [];
  }
  data.paymentHistory.push({ txId: updatedTxnId, date: new Date() });
  data.nextPaymentDue = nextPaymentDue.currentDate;

  return data;
}
