import type { ExtendedTransaction } from "~lib/transactions";

export type Announcement = {
  title: string;
  description: string;
  timestamp: number;
};

export const ANNOUNCEMENTS: Announcement[] = [
  {
    title: "ArConnect is now Wander!",
    description: "To learn more visit https://wander.app.",
    timestamp: 1740489749000,
  },
  {
    title: "Introducing Wander Agents",
    description: "Auto-convert your daily AO token earnings.",
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
  return announcements.map((announcement, index) => {
    const date = new Date(announcement.timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    return {
      cursor: `announcement_${index}`,
      node: {
        id: `announcement_${announcement.timestamp}_${index}`,
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
          timestamp: Math.floor(announcement.timestamp / 1000), // Convert to seconds
          height: 0,
        },
        tags: [],
      },
      month,
      year,
      day,
      date: date.toISOString(),
      transactionType: "announcement",
      // Store announcement data for rendering
      announcementData: {
        title: announcement.title,
        description: announcement.description,
      },
    } as ExtendedTransaction & { announcementData: { title: string; description: string } };
  });
}
