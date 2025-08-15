import Application, { type InitAppParams } from "~applications/application";
import { ExtensionStorage } from "~utils/storage";
import type { Storage } from "@plasmohq/storage";

export default class Subscription {
  activeAddress: string;
  application: Application;
  applicationUrl: string;
  #storage: Storage;

  constructor(activeAddress: string, applicationUrl?: string) {
    this.activeAddress = activeAddress;
    this.application = new Application(applicationUrl);
    this.applicationUrl = applicationUrl;
    this.#storage = ExtensionStorage;
  }
}

/**
 * Params to add a subscription
 * &
 * Subscription info submitted by the dApp
 */
export interface SubscriptionData {
  arweaveAccountAddress: string;
  applicationIcon?: string;
  applicationName: string;
  subscriptionName: string;
  subscriptionFeeAmount: number;
  applicationAutoRenewal: boolean;
  applicationAllowance: number;
  subscriptionStatus?: SubscriptionStatus;
  recurringPaymentFrequency: RecurringPaymentFrequency;
  nextPaymentDue: Date | string;
  subscriptionManagementUrl: string;
  subscriptionStartDate?: Date | string;
  subscriptionEndDate: Date | string;
  paymentHistory?: PaymentHistoryEntry[];
}

interface PaymentHistoryEntry {
  txId: string;
  date: Date;
}

/**
 * Enum for subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = "Active",
  EXPIRED = "Expired",
  CANCELED = "Canceled",
  AWAITING_PAYMENT = "Awaiting-Payment",
}

/**
 * Enum for recurring payment frequency
 */
export enum RecurringPaymentFrequency {
  // HOURLY = "Hourly",
  // EVERY_5_MINUTES = "5 minutes",
  // ANNUALLY = "Annually",

  QUARTERLY = "Quarterly",
  MONTHLY = "Monthly",
  WEEKLY = "Weekly",
  DAILY = "Daily",
}
