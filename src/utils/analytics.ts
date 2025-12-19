import { getSetting } from "~settings";
import { ExtensionStorage, TempTransactionStorage } from "./storage";
import { getActiveKeyfile, getActiveAddress, getWalletKeyLength } from "~wallets";
import { isLocalWallet } from "./assertions";
import { freeDecryptedWallet } from "~wallets/encryption";
import { ERR_MSG_NO_WALLETS_ADDED } from "~utils/auth/auth.constants";
import Analytics from "analytics";
import browser from "webextension-polyfill";
import { log } from "./log/log.utils";
import { LOG_GROUP } from "./log/log.utils";
import { getUserCountryCode } from "./location";
import { v4 as uuid } from "uuid";

const GA_MEASUREMENT_ID = process.env.PLASMO_PUBLIC_GA_MEASUREMENT_ID || "";
const GA_API_SECRET = process.env.PLASMO_PUBLIC_GA_API_SECRET || "";
const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;
const SESSION_EXPIRATION_IN_MIN = 30;
const ENABLE_DEV_ANALYTICS = process.env.PLASMO_PUBLIC_ENABLE_DEV_ANALYTICS === "true";

const manifest = browser.runtime.getManifest();

// TODO: add analytics for signature

export enum EventType {
  FUNDED = "FUNDED",
  CONNECTED_APP = "CONNECTED_APP",
  LOGIN = "LOGIN",
  ONBOARDED = "ONBOARDED",
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
  BITS_LENGTH = "BITS_LENGTH",
  AGENT_DASHBOARD = "AGENT_DASHBOARD",
  AO_YIELD_AGENT_CREATED = "AO_YIELD_AGENT_CREATED",
  AO_YIELD_AGENT_CANCEL = "AO_YIELD_AGENT_CANCEL",
  AO_YIELD_AGENT_END = "AO_YIELD_AGENT_END",
  AO_YIELD_AGENT_TRANSACTION = "AO_YIELD_AGENT_TRANSACTION",
  SELECT_AGENT = "SELECT_AGENT",
  LIQUID_OPS_AGENT_DEPOSIT = "LIQUID_OPS_AGENT_DEPOSIT",
  LIQUID_OPS_AGENT_WITHDRAW = "LIQUID_OPS_AGENT_WITHDRAW",
  VIEW_BENEFITS = "VIEW_BENEFITS",
  GET_WANDER_TOKENS = "GET_WANDER_TOKENS",
  EARN_BUTTON = "EARN_BUTTON",
  MANAGE_EARNINGS_BUTTON = "MANAGE_EARNINGS_BUTTON",
  ALLOCATION_UPDATE = "ALLOCATION_UPDATE",
  SWAP_BUTTON = "SWAP_BUTTON",
  SWAP_COMPLETED = "SWAP_COMPLETED",
  ARNS_MANAGE_BUTTON = "ARNS_MANAGE_BUTTON",
  ARNS_PURCHASE_SUCCESS = "ARNS_PURCHASE_SUCCESS",
  ARNS_PURCHASE_ERROR = "ARNS_PURCHASE_ERROR",
  ARNS_SET_PRIMARY_NAME_SUCCESS = "ARNS_SET_PRIMARY_NAME_SUCCESS",
  ARNS_SET_PRIMARY_NAME_ERROR = "ARNS_SET_PRIMARY_NAME_ERROR",
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
  GETTING_STARTED_PERSONALIZE = "GETTING_STARTED_PERSONALIZE",
  GETTING_STARTED_PIN_EXTENSION = "GETTING_STARTED_PIN_EXTENSION",
  SUBSCRIPTIONS_MANAGEMENT = "SUBSCRIPTIONS_MANAGEMENT",
  TRANSAK_PURCHASE = "TRANSAK_PURCHASE",
  TRANSAK_CONFIRM_PURCHASE = "TRANSAK_CONFIRM_PURCHASE",
  TRANSAK_PURCHASE_PENDING = "TRANSAK_PURCHASE_PENDING",
  SUBSCRIPTIONS = "SUBSCRIPTIONS",
  AGENTS = "AGENTS",
  AO_YIELD_AGENT_CREATE = "AO_YIELD_AGENT_CREATE",
  AO_YIELD_AGENT_CONFIRM = "AO_YIELD_AGENT_CONFIRM",
  AO_YIELD_AGENT_ACTIVATED = "AO_YIELD_AGENT_ACTIVATED",
  AO_YIELD_AGENT_ACTIVATION_FAILED = "AO_YIELD_AGENT_ACTIVATION_FAILED",
  AO_YIELD_AGENT_MANAGE = "AO_YIELD_AGENT_MANAGE",
  AO_YIELD_AGENT_EDIT = "AO_YIELD_AGENT_EDIT",
  AO_YIELD_AGENT_TX_HISTORY = "AO_YIELD_AGENT_TX_HISTORY",
  AO_YIELD_AGENT_HISTORY = "AO_YIELD_AGENT_HISTORY",
  AO_YIELD_AGENT_HISTORY_DETAILS = "AO_YIELD_AGENT_HISTORY_DETAILS",
  LIQUID_OPS_AGENTS = "LIQUID_OPS_AGENTS",
  LIQUID_OPS_AGENT_DEPOSIT = "LIQUID_OPS_AGENT_DEPOSIT",
  LIQUID_OPS_AGENT_WITHDRAW = "LIQUID_OPS_AGENT_WITHDRAW",
  LIQUID_OPS_AGENT_CONFIRM_DEPOSIT = "LIQUID_OPS_AGENT_CONFIRM_DEPOSIT",
  LIQUID_OPS_AGENT_CONFIRM_WITHDRAW = "LIQUID_OPS_AGENT_CONFIRM_WITHDRAW",
  LIQUID_OPS_AGENT_DEPOSIT_SUCCESS = "LIQUID_OPS_AGENT_DEPOSIT_SUCCESS",
  LIQUID_OPS_AGENT_WITHDRAW_SUCCESS = "LIQUID_OPS_AGENT_WITHDRAW_SUCCESS",
  LIQUID_OPS_AGENT_DEPOSIT_FAILURE = "LIQUID_OPS_AGENT_DEPOSIT_FAILURE",
  LIQUID_OPS_AGENT_WITHDRAW_FAILURE = "LIQUID_OPS_AGENT_WITHDRAW_FAILURE",
  LIQUID_OPS_AGENT_MANAGE = "LIQUID_OPS_AGENT_MANAGE",
  YOUR_TIER = "YOUR_TIER",
  EARN = "EARN",
  EARN_MANAGE = "EARN_MANAGE",
  EARN_ALLOCATION_SET = "EARN_ALLOCATION_SET",
  SWAP = "SWAP",
  SWAP_REVIEW = "SWAP_REVIEW",
  SWAP_PROGRESS = "SWAP_PROGRESS",
  SWAP_COMPLETE = "SWAP_COMPLETE",
  SWAP_HISTORY = "SWAP_HISTORY",
  SWAP_FAILED = "SWAP_FAILED",
  ARNS_HOME = "ARNS_HOME",
  ARNS_PURCHASE_SEARCH = "ARNS_PURCHASE_SEARCH",
  ARNS_PURCHASE = "ARNS_PURCHASE",
  ARNS_PURCHASE_CONFIRM = "ARNS_PURCHASE_CONFIRM",
  ARNS_PURCHASE_SUCCESS = "ARNS_PURCHASE_SUCCESS",
  ARNS_PURCHASE_ERROR = "ARNS_PURCHASE_ERROR",
  ARNS_MANAGE = "ARNS_MANAGE",
  ARNS_SET_PRIMARY_NAME = "ARNS_SET_PRIMARY_NAME",
  ARNS_SET_PRIMARY_NAME_SUCCESS = "ARNS_SET_PRIMARY_NAME_SUCCESS",
  ARNS_SET_PRIMARY_NAME_ERROR = "ARNS_SET_PRIMARY_NAME_ERROR",
}

/**
 * Get or create a unique user/client ID for analytics
 */
const getOrCreateClientId = async (): Promise<string> => {
  let userId = await ExtensionStorage.get("user_id");
  if (!userId) {
    userId = uuid();
    await ExtensionStorage.set("user_id", userId);
  }
  return userId;
};

/**
 * Get or create session ID (expires after SESSION_EXPIRATION_IN_MIN)
 */
async function getOrCreateSessionId(): Promise<string> {
  const currentTimeInMs = Date.now();
  try {
    let sessionData = await ExtensionStorage.get<{ session_id: string; timestamp: number }>("session_data");

    // Check if session exists and is still valid
    if (sessionData?.timestamp) {
      const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;

      if (durationInMin <= SESSION_EXPIRATION_IN_MIN) {
        // Session is valid, update timestamp and return
        sessionData.timestamp = currentTimeInMs;
        await ExtensionStorage.set("session_data", sessionData);
        return sessionData.session_id;
      }
    }

    // Create new session (either expired or doesn't exist)
    const newSessionData = {
      session_id: currentTimeInMs.toString(),
      timestamp: currentTimeInMs,
    };
    await ExtensionStorage.set("session_data", newSessionData);
    return newSessionData.session_id;
  } catch (error) {
    log(LOG_GROUP.ANALYTICS, "Failed to get or create session id:", error);
    return currentTimeInMs.toString();
  }
}

function GoogleAnalyticsPlugin() {
  return {
    name: "google-analytics-plugin",
    config: {},

    initialize: async () => {
      try {
        const userId = await getOrCreateClientId();
        analytics.identify(userId);
      } catch {}
      log(LOG_GROUP.ANALYTICS, "✅ Google Analytics plugin initialized");
    },

    identify: async () => {},

    page: async ({ payload, instance }: any) => {
      try {
        const userId = instance.user("userId") || (await getOrCreateClientId());
        const countryCode = await getUserCountryCode();

        const body: any = {
          client_id: userId,
          events: [
            {
              name: "page_view",
              params: {
                session_id: await getOrCreateSessionId(),
                engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MSEC,
                page_title: payload.properties?.title || payload.title,
                page_location: payload.properties?.url || "",
                page_path: payload.properties?.path || "",
                page_hash: payload.properties?.hash || "",
                page_search: payload.properties?.page_search || "",
                page_referrer: payload.properties?.referrer || "",
              },
            },
          ],
        };

        if (countryCode) {
          body.user_location = { country_id: countryCode };
        }

        const response = await fetch(`${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok || response.status === 204) {
          log(LOG_GROUP.ANALYTICS, "📄 Page view sent to GA:", payload.properties?.title || payload.title);
        } else {
          log(LOG_GROUP.ANALYTICS, "⚠️ GA page view response:", response.status, response.statusText);
        }
      } catch (error) {
        log(LOG_GROUP.ANALYTICS, "❌ GA page tracking failed:", error);
      }
    },

    track: async ({ payload, instance }: any) => {
      try {
        const userId = instance.user("userId") || (await getOrCreateClientId());
        const countryCode = await getUserCountryCode();

        if (!payload.properties.session_id) {
          payload.properties.session_id = await getOrCreateSessionId();
        }

        if (!payload.properties.engagement_time_msec) {
          payload.properties.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_MSEC;
        }

        const body: any = {
          client_id: userId,
          events: [
            {
              name: payload.event,
              params: { ...payload.properties },
            },
          ],
        };

        if (countryCode) {
          body.user_location = { country_id: countryCode };
        }

        const response = await fetch(`${GA_ENDPOINT}?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (response.ok || response.status === 204) {
          log(LOG_GROUP.ANALYTICS, "🎯 Event sent to GA:", payload.event);
        } else {
          log(LOG_GROUP.ANALYTICS, "⚠️ GA event response:", response.status, response.statusText);
        }
      } catch (error) {
        log(LOG_GROUP.ANALYTICS, "❌ GA event tracking failed:", error);
      }
    },
  };
}

const analytics = Analytics({
  app: manifest.name,
  version: manifest.version,
  debug: false,
  plugins: [GoogleAnalyticsPlugin()],
});

/**
 * Track page views
 */
export const trackPage = async (title: PageType) => {
  try {
    // Only track BE production events (unless dev analytics is explicitly enabled):
    if (
      (process.env.NODE_ENV === "development" && !ENABLE_DEV_ANALYTICS) ||
      import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ) {
      return;
    }

    const enabled = await getSetting("analytics").getValue();
    if (!enabled) return;

    await analytics.page({ title });
  } catch (err) {
    log(LOG_GROUP.ANALYTICS, "Page tracking error:", err);
  }
};

/**
 * Track events directly (for background scripts)
 */
export const trackDirect = async (event: EventType, properties: Record<string, unknown>) => {
  try {
    // Only track BE production events (unless dev analytics is explicitly enabled):
    if (
      (process.env.NODE_ENV === "development" && !ENABLE_DEV_ANALYTICS) ||
      import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ) {
      return;
    }

    const enabled = await getSetting("analytics").getValue();
    if (!enabled) return;

    await analytics.track(event, { ...properties });
  } catch (err) {
    log(LOG_GROUP.ANALYTICS, `Failed to track event ${event}:`, err);
  }
};

/**
 * Track custom events
 */
export const trackEvent = async (eventName: EventType, properties: any) => {
  try {
    // Only track BE production events (unless dev analytics is explicitly enabled):
    if (
      (process.env.NODE_ENV === "development" && !ENABLE_DEV_ANALYTICS) ||
      import.meta.env?.VITE_IS_EMBEDDED_APP === "1"
    ) {
      return;
    }

    // first we check if we are allowed to collect data
    const enabled = await getSetting("analytics").getValue();
    if (!enabled) return;

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
      const hasBeenTracked = await ExtensionStorage.get<boolean>(`wallet_funded_${activeAddress}`);
      if (hasBeenTracked) {
        return;
      }
    }

    const time = Date.now();

    await analytics.track(eventName, { ...properties });

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
    log(LOG_GROUP.ANALYTICS, `Failed to track event ${eventName}:`, err);
  }
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

  const hasBeenTracked = await ExtensionStorage.get<boolean | WalletBitsCheck>(storageKey);

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

    const { actualLength, expectedLength } = await getWalletKeyLength(decryptedWallet.keyfile);

    freeDecryptedWallet(decryptedWallet.keyfile);

    const lengthsMatch = expectedLength === actualLength;

    await ExtensionStorage.set(`bits_check_${activeAddress}`, {
      checked: true,
      mismatch: !lengthsMatch,
    });

    trackEvent(EventType.BITS_LENGTH, { mismatch: !lengthsMatch });

    return !lengthsMatch;
  } catch (error) {
    console.error(
      `An error occurred during wallet integrity check: ${error instanceof Error ? error.message : String(error)}`,
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
  "CA", // Canada
];

// Defaults to true to
export const isUserInGDPRCountry = async (): Promise<boolean> => {
  try {
    const countryCode = await getUserCountryCode();
    return GDPR_COUNTRIES_AND_OTHERS.includes(countryCode);
  } catch (error) {
    console.error("Error fetching location:", error);
    return true;
  }
};
