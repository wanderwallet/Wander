import { getSetting } from "~settings";
import { ExtensionStorage, TempTransactionStorage } from "./storage";
// import { AnalyticsBrowser } from "@segment/analytics-next";
import {
  getActiveKeyfile,
  getActiveAddress,
  getWalletKeyLength
} from "~wallets";
import { v4 as uuid } from "uuid";
import browser from "webextension-polyfill";
import axios from "axios";
import { isLocalWallet } from "./assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import { ERR_MSG_NO_WALLETS_ADDED } from "~utils/auth/auth.constants";

const PUBLIC_SEGMENT_WRITEKEY = "J97E4cvSZqmpeEdiUQNC2IxS1Kw4Cwxm";

// TODO: uncomment this once we have a fix for the analytics
// const analytics = AnalyticsBrowser.load({
//   writeKey: PUBLIC_SEGMENT_WRITEKEY
// });

export enum EventType {
  FUNDED = "FUNDED",
  CONNECTED_APP = "CONNECTED_APP",
  LOGIN = "LOGIN",
  ONBOARDED = "ONBOARDED",
  BALANCE = "BALANCE",
  SIGNED = "SIGNED",
  TRANSACTION_INCOMPLETE = "TRANSACTION_INCOMPLETE",
  FALLBACK = "FALLBACK",
  BUY_AR_DASHBOARD = "BUY_AR_DASHBOARD",
  BUY_AR_PURCHASE = "BUY_AR_PURCHASE",
  BUY_AR_CONFIRM_PURCHASE = "BUY_AR_CONFIRM_PURCHASE",
  CONTACTS = "CONTACTS",
  ADD_CONTACT = "ADD_CONTACT",
  REMOVE_CONTACT = "REMOVE_CONTACT",
  SEND_ALLOWANCE_CHANGE = "SEND_ALLOWANCE_CHANGE",
  TX_SENT = "TX_SENT",
  SUBSCRIBED = "SUBSCRIBED",
  UNSUBSCRIBED = "UNSUBSCRIBED",
  SUBSCRIPTION_PAYMENT = "SUBSCRIPTION_PAYMENT",
  BITS_LENGTH = "BITS_LENGTH"
}

export enum PageType {
  HOME = "HOMEPAGE",
  EXPLORE = "EXPLORE",
  RECEIVE = "RECEIVE",
  SETTINGS = "SETTINGS",
  SEND = "SEND",
  SEND_AMOUNT = "SEND_AMOUNT",
  SEND_NOTE = "SEND_NOTE",
  CONFIRM_SEND = "CONFIRM_SEND",
  SEND_COMPLETE = "SEND_COMPLETE",
  ONBOARD_START = "ONBOARD_START",
  ONBOARD_NEW_ACCOUNT = "ONBOARD_NEW_ACCOUNT",
  ONBOARD_PASSWORD = "ONBOARD_PASSWORD",
  ONBOARD_BACKUP = "ONBOARD_BACKUP",
  ONBOARD_SEEDPHRASE = "ONBOARD_SEEDPHRASE",
  ONBOARD_PERMISSIONS = "ONBOARD_PERMISSIONS",
  ONBOARD_THEME = "ONBOARD_THEME",
  ONBOARD_COMPLETE = "ONBOARD_COMPLETE",
  GETTING_STARTED_WELCOME = "GETTING_STARTED_WELCOME",
  GETTING_STARTED_TOKENS = "GETTING_STARTED_TOKENS",
  GETTING_STARTED_ONRAMP = "GETTING_STARTED_ONRAMP",
  GETTING_STARTED_EXPLORE = "GETTING_STARTED_EXPLORE",
  GETTING_STARTED_CONNECT = "GETTING_STARTED_CONNECT",
  SUBSCRIPTIONS_MANAGEMENT = "SUBSCRIPTIONS_MANAGEMENT",
  TRANSAK_PURCHASE = "TRANSAK_PURCHASE",
  TRANSAK_CONFIRM_PURCHASE = "TRANSAK_CONFIRM_PURCHASE",
  TRANSAK_PURCHASE_PENDING = "TRANSAK_PURCHASE_PENDING",
  SUBSCRIPTIONS = "SUBSCRIPTIONS"
}

export const trackPage = async (title: PageType) => {
  // TODO: remove this once we have a fix for the analytics
  return;
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  try {
    // await analytics.page("Wander Extension", {
    //   title
    // });
  } catch (err) {
    console.log("err", err);
  }
};

export const trackDirect = async (
  event: EventType,
  properties: Record<string, unknown>
) => {
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  let userId = await ExtensionStorage.get("user_id");
  if (!userId) {
    userId = uuid();
    await ExtensionStorage.set("user_id", userId);
  }

  return fetch("https://api.segment.io/v1/t", {
    method: "POST",
    body: JSON.stringify({
      event,
      properties,
      messageId: uuid(),
      sentAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      type: "track",
      userId: userId,
      writeKey: PUBLIC_SEGMENT_WRITEKEY
    })
  });
};

export const trackEvent = async (eventName: EventType, properties: any) => {
  // TODO: remove this once we have a fix for the analytics
  return;
  // first we check if we are allowed to collect data
  const enabled = await getSetting("analytics").getValue();

  if (!enabled) return;

  // only track in prod
  if (process.env.NODE_ENV === "development") return;

  const ONE_HOUR_IN_MS = 3600000;

  // TODO:login is tracked only once and compared to an hour period before logged as another Login event
  if (eventName === EventType.LOGIN) {
    const storageTime = await TempTransactionStorage.get(EventType.LOGIN);

    if (storageTime && Date.now() < Number(storageTime) + ONE_HOUR_IN_MS) {
      return;
    }
  }

  const activeAddress = await ExtensionStorage.get<string>("active_address");

  if (eventName === EventType.FUNDED) {
    const hasBeenTracked = await ExtensionStorage.get<boolean>(
      `wallet_funded_${activeAddress}`
    );
    if (hasBeenTracked) {
      return;
    }
  }

  try {
    const time = Date.now();

    // await analytics.track(eventName, { ...properties });

    // POST TRACK EVENTS
    // only log login once every hour
    if (eventName === EventType.LOGIN) {
      await TempTransactionStorage.set(eventName, time);
    }

    // only log funded once
    if (eventName === EventType.FUNDED) {
      await ExtensionStorage.set(`wallet_funded_${activeAddress}`, true);
    }
  } catch (err) {
    console.log(`Failed to track event ${eventName}:`, err);
  }
};

/**
 * Initializes the AR balance event tracker.
 * This function sets up a monthly alarm to track the total balance.
 * It schedules the first alarm to the start of the next month and
 * stores this schedule time in the extension storage.
 */

export const initializeARBalanceMonitor = async () => {
  const timer = setToStartOfNextMonth(new Date());
  browser.alarms.create("track-balance", {
    when: timer.getTime()
  });
};

/**
 * Sets the given date to the start of the next month in UTC
 * The time is set to beginning of the month (00:00:00.000).
 * @param {Date} currentDate
 * @returns {Date} Date to trigger alarm
 */

export const setToStartOfNextMonth = (currentDate: Date): Date => {
  const newDate = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth() + 1,
      1,
      0,
      0,
      0,
      0
    )
  );
  return newDate;
};

export interface WalletBitsCheck {
  checked: boolean;
  mismatch: boolean;
}

/**
 * Checks the bit length the active Arweave wallet.
 *
 * This function verifies the integrity of the currently active wallet by comparing
 * the expected length of the public key with its actual length. It uses the ArweaveSigner
 * to generate the public key from the wallet's keyfile.
 *
 *
 * @returns {Promise<boolean | null>} A promise that resolves to:
 *   - true if an integrity issue is detected (lengths don't match)
 *   - false if no integrity issue is found
 *   - null if the check has already been performed for this address or if an error occurs
 *
 * @throws {Error} If no wallets are added or if there's an issue accessing the wallet
 */
export const checkWalletBits = async (): Promise<boolean | null> => {
  const activeAddress = await getActiveAddress();
  if (!activeAddress) {
    return null;
  }

  const storageKey = `bits_check_${activeAddress}`;

  const hasBeenTracked = await ExtensionStorage.get<boolean | WalletBitsCheck>(
    storageKey
  );

  if (typeof hasBeenTracked === "boolean") {
    await ExtensionStorage.remove(storageKey);
  } else if (hasBeenTracked && hasBeenTracked.checked) {
    return null;
  }

  try {
    const decryptedWallet = await getActiveKeyfile().catch((e) => {
      throw new Error(ERR_MSG_NO_WALLETS_ADDED);
    });
    isLocalWallet(decryptedWallet);

    const { actualLength, expectedLength } = await getWalletKeyLength(
      decryptedWallet.keyfile
    );

    freeDecryptedWallet(decryptedWallet.keyfile);

    const lengthsMatch = expectedLength === actualLength;

    await ExtensionStorage.set(`bits_check_${activeAddress}`, {
      checked: true,
      mismatch: !lengthsMatch
    });

    await trackEvent(EventType.BITS_LENGTH, { mismatch: !lengthsMatch });

    return !lengthsMatch;
  } catch (error) {
    console.error(
      `An error occurred during wallet integrity check: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return null;
  }
};

const GDPR_COUNTRIES_AND_OTHERS = [
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  "GB", // United Kingdom
  "CH", // Switzerland
  "BH", // Bahrain
  "IL", // Israel
  "QA", // Qatar
  "TR", // Turkey
  "KE", // Kenya
  "MU", // Mauritius
  "NG", // Nigeria
  "ZA", // South Africa
  "UG", // Uganda
  "JP", // Japan
  "KR", // South Korea
  "NZ", // New Zealand
  "AR", // Argentina
  "BR", // Brazil
  "UY", // Uruguay
  "CA" // Canada
];

// Defaults to true to
export const isUserInGDPRCountry = async (): Promise<boolean> => {
  try {
    const response = await axios.get("https://ipinfo.io?token=f73f7a8b88a8bf");

    const { country } = response.data;
    return GDPR_COUNTRIES_AND_OTHERS.includes(country);
  } catch (error) {
    console.error("Error fetching location:", error);
    return true;
  }
};
