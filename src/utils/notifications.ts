import { arPlaceholder } from "~routes/popup/send";
import { ExtensionStorage } from "./storage";
import type { Transaction } from "~notifications/api";
import type { Token } from "~tokens/token";
import { fetchTokenByProcessId } from "~lib/transactions";

export const fetchNotifications = async (address: string) => {
  const n = await ExtensionStorage.get(`notifications_${address}`);
  if (!n) return false;
  const notifications = JSON.parse(n);
  if (
    !notifications.arBalanceNotifications.arNotifications.length &&
    !notifications.aoNotifications.aoNotifications.length
  ) {
    return false;
  }
  return notifications;
};

export const mergeAndSortNotifications = (
  arNotifications,
  aoNotifications
): Transaction[] => {
  const mergedNotifications = [...arNotifications, ...aoNotifications];

  // filter notifications without timestamps
  const pendingNotifications = mergedNotifications.filter(
    (notification) => !notification.node.block?.timestamp
  );

  // set status to "pending" for notifications without timestamps
  pendingNotifications.forEach((notification) => {
    notification.node.block = { timestamp: "pending" };
  });

  // remove pending notifications from the merged array
  const sortedNotifications = mergedNotifications.filter(
    (notification) => notification.node.block.timestamp !== "pending"
  );

  // sort notifications with timestamps
  sortedNotifications.sort(
    (a, b) => b.node.block.timestamp - a.node.block.timestamp
  );

  // place pending notifications at the most recent index
  sortedNotifications.unshift(...pendingNotifications);

  return sortedNotifications;
};

export { fetchTokenByProcessId };

export const fetchTokenById = async (tokenId: string): Promise<Token> => {
  if (tokenId === "AR") return arPlaceholder;

  return null;
};

export const extractQuantityTransferred = (tags: any[]): number | null => {
  const inputTag = tags.find((tag) => tag.name === "Input");
  if (!inputTag) return null;

  try {
    const inputValue = JSON.parse(inputTag.value);
    return inputValue.qty ? inputValue.qty : null;
  } catch (error) {
    console.error("Error parsing Input tag value:", error);
    return null;
  }
};
