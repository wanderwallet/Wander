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
  {
    id: 5,
    title: browser.i18n.getMessage("announcement_5_title"),
    description: browser.i18n.getMessage("announcement_5_description"),
    body: browser.i18n.getMessage("announcement_5_body"),
    timestamp: 1755000000000,
  },
  {
    id: 6,
    title: browser.i18n.getMessage("announcement_6_title"),
    description: browser.i18n.getMessage("announcement_6_description"),
    body: browser.i18n.getMessage("announcement_6_body"),
    timestamp: 1755525600000,
  },
  {
    id: 7,
    title: browser.i18n.getMessage("announcement_7_title"),
    description: browser.i18n.getMessage("announcement_7_description"),
    body: browser.i18n.getMessage("announcement_7_body"),
    timestamp: 1756735200000,
  },
  {
    id: 8,
    title: browser.i18n.getMessage("announcement_8_title"),
    description: browser.i18n.getMessage("announcement_8_description"),
    body: browser.i18n.getMessage("announcement_8_body"),
    timestamp: 1757937600000,
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

const stargridAccessAnnouncement = {
  startDate: new Date("2025-08-18T10:00:00-04:00"), // EDT
  endDate: new Date("2025-08-24T23:59:00-04:00"), // EDT
};

export const isStargridAnnouncementActive = () => {
  const now = new Date();
  return now >= stargridAccessAnnouncement.startDate && now <= stargridAccessAnnouncement.endDate;
};
