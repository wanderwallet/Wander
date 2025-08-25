import { ExtensionStorage } from "~utils/storage/storage";
import { getActiveAddress } from "~wallets";
import iconUrl from "url:/assets/icon512.png";
import browser, { type Alarms } from "webextension-polyfill";
import { arNotificationsHandler } from "~api/background/handlers/alarms/notifications/notifications-alarm.utils";
import {
  ALL_AR_RECEIVER_QUERY,
  ALL_AR_SENT_QUERY,
  AO_LIQUIDOPS_RECEIVER_QUERY,
  AO_RECEIVER_QUERY,
  AO_SENT_QUERY,
  AR_RECEIVER_QUERY,
  AR_SENT_QUERY,
} from "~notifications/utils";

export async function handleNotificationsAlarm(alarm?: Alarms.Alarm) {
  if (!alarm?.name.startsWith("notifications")) return;

  const notificationSetting: boolean = await ExtensionStorage.get("setting_notifications");
  let aoNotificationSetting: string[] | undefined = await ExtensionStorage.get("setting_notifications_customize");

  if (!aoNotificationSetting) {
    await ExtensionStorage.set("setting_notifications_customize", ["default"]);
    aoNotificationSetting = ["default"];
  }
  const address = await getActiveAddress();

  try {
    const storedNotifications = await ExtensionStorage.get(`notifications_${address}`);

    const parsedNotifications = storedNotifications ? JSON.parse(storedNotifications) : null;

    const aoBlockHeight = parsedNotifications?.aoNotifications?.lastStoredBlockHeight ?? 0;

    const arBalanceBlockHeight = parsedNotifications?.arBalanceNotifications?.lastStoredBlockHeight ?? 0;

    const [arNotifications, newArMaxHeight, newArTransactions] = await arNotificationsHandler(
      address,
      arBalanceBlockHeight,
      notificationSetting,
      [
        {
          query: !aoNotificationSetting.includes("allTxns") ? AR_RECEIVER_QUERY : ALL_AR_RECEIVER_QUERY,
          variables: { address },
          isAllTxns: aoNotificationSetting.includes("allTxns"),
        },
        {
          query: !aoNotificationSetting.includes("allTxns") ? AR_SENT_QUERY : ALL_AR_SENT_QUERY,
          variables: { address },
          isAllTxns: aoNotificationSetting.includes("allTxns"),
        },
      ],
    );

    let aoNotifications = [];
    let newAoMaxHeight = 0;
    let newAoTransactions = [];
    if (aoNotificationSetting.includes("default")) {
      [aoNotifications, newAoMaxHeight, newAoTransactions] = await arNotificationsHandler(
        address,
        aoBlockHeight,
        notificationSetting,

        [
          {
            query: AO_RECEIVER_QUERY,
            variables: { address },
          },
          {
            query: AO_SENT_QUERY,
            variables: { address },
          },
          {
            query: AO_LIQUIDOPS_RECEIVER_QUERY,
            variables: { address },
          },
        ],
      );
    }
    const newTransactions = [...newAoTransactions, ...newArTransactions];
    if (newTransactions.length > 0) {
      const notificationId = await browser.notifications.create({
        type: "basic",
        iconUrl,
        title: newTransactions.length === 1 ? "New Transaction" : "New Transactions",
        message: `You have ${newTransactions.length} new transaction${newTransactions.length === 1 ? "" : "s"}.`,
      });

      // Listen for clicks on the notification
      browser.notifications.onClicked.addListener((clickedNotificationId) => {
        if (clickedNotificationId === notificationId) {
          browser.tabs.create({ url: browser.runtime.getURL(`tabs/fullscreen.html?tab=feed`) });
        }
      });
    }

    await ExtensionStorage.set(
      `notifications_${address}`,
      JSON.stringify({
        arBalanceNotifications: {
          arNotifications,
          lastStoredBlockHeight: newArMaxHeight,
        },
        aoNotifications: {
          aoNotifications,
          lastStoredBlockHeight: newAoMaxHeight,
        },
      }),
    );
  } catch (err) {
    console.error("Error updating notifications:", err);
  }
}
