import browser from "webextension-polyfill";
import { ExtensionStorage } from "~utils/storage";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { SwapData } from "../../swap.types";
import { formatBalance } from "~utils/format";
import BigNumber from "bignumber.js";
import iconUrl from "url:/assets/icon512.png";

/**
 * Send a notification for swap completion or failure
 * @param swap The swap data
 * @param type Success or failure notification
 */
export async function sendSwapNotification(swap: SwapData, type: "success" | "failed"): Promise<void> {
  try {
    // Check if notifications are enabled
    const notificationsEnabled: boolean = await ExtensionStorage.get("setting_notifications");

    if (!notificationsEnabled) {
      log(LOG_GROUP.SWAP, "Notifications disabled, skipping swap notification");
      return;
    }

    const { title, message, icon } = getNotificationContent(swap, type);

    await browser.notifications.create({
      type: "basic",
      iconUrl: icon,
      title,
      message,
    });

    log(LOG_GROUP.SWAP, `Swap ${type} notification sent for ${swap.transferId}`);
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error sending swap notification", error);
  }
}

/**
 * Generate notification content based on swap data and type
 * @param swap The swap data
 * @param type Success or failure
 * @returns Notification content
 */
function getNotificationContent(
  swap: SwapData,
  type: "success" | "failed",
): { title: string; message: string; icon: string } {
  const amountIn =
    swap.amountIn && swap.sendToken
      ? formatBalance(BigNumber(swap.amountIn).shiftedBy(-swap.sendToken.Denomination).toFixed())
      : "Unknown";

  const amountOut =
    swap.selectedPoolInfo?.quoteOutput?.amountOut && swap.receiveToken
      ? formatBalance(
          BigNumber(swap.selectedPoolInfo.quoteOutput.amountOut).shiftedBy(-swap.receiveToken.Denomination).toFixed(),
        )
      : "Unknown";

  const sendTicker = swap.sendToken?.Ticker || "Token";
  const receiveTicker = swap.receiveToken?.Ticker || "Token";

  if (type === "success") {
    return {
      title: "Swap Completed Successfully! 🎉",
      message: `${amountIn} ${sendTicker} → ${amountOut} ${receiveTicker}`,
      icon: iconUrl,
    };
  } else {
    return {
      title: "Swap Failed ❌",
      message: `${amountIn} ${sendTicker} → ${receiveTicker} swap could not be completed`,
      icon: iconUrl,
    };
  }
}

/**
 * Clear any existing swap-related notifications
 */
export async function clearSwapNotifications(): Promise<void> {
  try {
    const notifications = await browser.notifications.getAll();

    for (const [notificationId, notification] of Object.entries(notifications)) {
      if (notification.title?.includes("Swap") || notification.message?.includes("swap")) {
        await browser.notifications.clear(notificationId);
      }
    }
  } catch (error) {
    log(LOG_GROUP.SWAP, "Error clearing swap notifications", error);
  }
}
