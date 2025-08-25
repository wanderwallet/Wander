import { getSetting } from "~settings";
import { nanoid } from "nanoid";
import type Transaction from "arweave/web/lib/transaction";
import Application from "~applications/application";
import { ExtensionStorage } from "~utils/storage";
import iconUrl from "url:/assets/icon512.png";
import browser from "webextension-polyfill";
import Arweave from "arweave";
import BigNumber from "bignumber.js";

/**
 * Fetch current arconfetti icon
 *
 * @returns Location to icon or false if it is disabled
 */
export async function arconfettiIcon(): Promise<string | false> {
  const defaultIcon = browser.runtime.getURL("assets/animation/arweave.png");

  try {
    const arConfettiSetting = getSetting("arconfetti");
    const iconName = await arConfettiSetting.getValue();

    if (!iconName) return false;

    // if iconName === true, that means the user is using the old
    // config for the arconfetti icon.
    // in this case we return the default icon
    if (iconName === true) {
      return defaultIcon;
    }

    // return icon location
    return browser.runtime.getURL(`assets/animation/${iconName}.png`);
  } catch {
    // return the default icon
    return defaultIcon;
  }
}

/**
 * Calculate transaction reward with the fee
 * multiplier
 *
 * @param transaction Transaction to calculate the reward for
 *
 * @returns Reward
 */
export async function calculateReward({ reward }: Transaction) {
  // fetch fee multiplier
  const multiplier = (await getSetting("fee_multiplier").getValue<number>()) || 1;

  // if the multiplier is 1, we don't do anything
  if (multiplier === 1) return reward;

  // calculate fee with multiplier
  const fee = BigNumber(reward).multipliedBy(multiplier);

  return fee.toFixed(0, BigNumber.ROUND_FLOOR);
}

/**
 * Notify the user of a transaction signing event
 *
 * @param price Price of the transaction in winston
 * @param id ID of the transaction
 * @param appURL URL of the current app
 * @param type Signed transaction type
 */
export async function signNotification(
  price: number | BigNumber,
  id: string,
  appURL: string,
  type: "sign" | "dispatch" = "sign",
) {
  async function getNotificationSetting() {
    return await ExtensionStorage.get("setting_sign_notification");
  }
  // fetch if notification is enabled
  const notificationSetting = await getNotificationSetting();

  if (notificationSetting === "false" || !notificationSetting) return;

  // get gateway config
  const app = new Application(appURL);
  const gateway = await app.getGatewayConfig();

  // create a client
  const arweave = new Arweave(gateway);

  // calculate price in AR
  const arPrice = BigNumber(arweave.ar.winstonToAr(price.toString()));

  // format price
  let maximumFractionDigits = 0;

  if (arPrice.lt(0.1)) maximumFractionDigits = 6;
  else if (arPrice.lt(10)) maximumFractionDigits = 4;
  else if (arPrice.lt(1000)) maximumFractionDigits = 2;

  const formattedPrice = arPrice.toFormat(maximumFractionDigits);

  // give an ID to the notification
  const notificationID = nanoid();

  // transaction message
  const message = browser.i18n.getMessage(
    type === "sign" ? "notification_description_native_tx" : "notification_description_dispatch_tx",
    formattedPrice,
  );

  // create the notification
  await browser.notifications.create(notificationID, {
    iconUrl,
    type: "basic",
    title: browser.i18n.getMessage(`notification_title_${type === "sign" ? "native" : "dispatched"}_tx`),
    message,
  });

  // listener for clicks
  const listener = async (clickedID: string) => {
    // check if it is the same notification
    if (clickedID !== notificationID) return;

    // open transaction in new tab
    await browser.tabs.create({
      url: `${gateway.protocol}://${gateway.host}/${id}`,
    });

    // remove notification & event listener after click
    browser.notifications.clear(clickedID);
    browser.notifications.onClicked.removeListener(listener);
  };

  // listen for notification click
  browser.notifications.onClicked.addListener(listener);
}
