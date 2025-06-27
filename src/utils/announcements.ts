import browser from "webextension-polyfill";
import type { ExtendedTransaction } from "~lib/transactions";

export type Announcement = {
  id: number;
  title: string;
  description: string;
  timestamp: number;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: browser.i18n.getMessage("announcement_1_title"),
    description: browser.i18n.getMessage("announcement_1_description"),
    timestamp: 1740489749000,
  },
  {
    id: 2,
    title: browser.i18n.getMessage("announcement_2_title"),
    description: browser.i18n.getMessage("announcement_2_description"),
    timestamp: 1750857749000,
  },
];

/**
 * Converts announcements to ExtendedTransaction format so they can be displayed
 * alongside regular transactions in the transaction list
 */
export function convertAnnouncementsToTransactions(
  announcements: Announcement[] = ANNOUNCEMENTS,
): ExtendedTransaction[] {
  return announcements.map((announcement) => {
    const date = new Date(announcement.timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return {
      cursor: "",
      node: {
        id: announcement.id.toString(),
        recipient: "",
        owner: {
          address: "",
        },
        quantity: {
          ar: "0",
        },
        fee: {
          ar: "0",
        },
        block: {
          timestamp: Math.floor(announcement.timestamp / 1000),
          height: 0,
        },
        tags: [],
      },
      month,
      year,
      day,
      date: date.toISOString(),
      transactionType: "announcement",
      announcementData: announcement,
    } as ExtendedTransaction & { announcementData: Announcement };
  });
}

export function getAnnouncement(id: string | number) {
  return ANNOUNCEMENTS.find((announcement) => announcement.id === Number(id));
}
