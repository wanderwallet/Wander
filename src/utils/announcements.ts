import browser from "webextension-polyfill";
import type { ExtendedTransaction } from "~lib/transactions";

export type Announcement = {
  id: number;
  title: string;
  description: string;
  body?: string;
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
  {
    id: 3,
    title: browser.i18n.getMessage("announcement_3_title"),
    description: browser.i18n.getMessage("announcement_3_description"),
    body: browser.i18n.getMessage("announcement_3_body"),
    timestamp: 1752105601000,
  },
  {
    id: 4,
    title: browser.i18n.getMessage("announcement_4_title"),
    description: browser.i18n.getMessage("announcement_4_description"),
    body: browser.i18n.getMessage("announcement_4_body"),
    timestamp: 1754265601000,
  },
];

/**
 * Converts announcements to ExtendedTransaction format so they can be displayed
 * alongside regular transactions in the transaction list
 */
export function convertAnnouncementsToTransactions(
  announcements: Announcement[] = ANNOUNCEMENTS,
): ExtendedTransaction[] {
  const convertedAnnouncements = announcements.map((announcement) => {
    if (announcement.timestamp > Date.now()) return null;
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
  return convertedAnnouncements.filter((a) => a !== null);
}

export function getAnnouncement(id: string | number) {
  return ANNOUNCEMENTS.find((announcement) => announcement.id === Number(id));
}

// -4:00 is used instead of -5:00 because during August, Eastern Time (ET)
// observes Daylight Saving Time (EDT), which is UTC-4:00. ET only becomes
// UTC-5:00 (EST) during winter months.
const astroBetaAnnouncement = {
  startDate: new Date("2025-08-04T10:00:00-04:00"), // EDT
  endDate: new Date("2025-08-10T23:59:00-04:00"), // EDT
};

export const isAstroBetaAnnouncementActive = () => {
  const now = new Date();
  return now >= astroBetaAnnouncement.startDate && now <= astroBetaAnnouncement.endDate;
};
