export const PENDING_TRANSACTIONS_ALARM_NAME = "pending-transactions-cleanup";
export const AO_PENDING_CLEANUP_ALARM_NAME_PREFIX = "ao-pending-cleanup-";

// AO transaction cleanup alarm intervals (in seconds)
export const PENDING_ALARM_CLEANUP_INTERVALS = [10, 30, 50, 70, 90];

// Main alarm interval (5 minutes)
export const PENDING_ALARM_INTERVAL_MINUTES = 5;
export const PENDING_ALARM_INTERVAL_MS = PENDING_ALARM_INTERVAL_MINUTES * 60 * 1000;

// Threshold for avoiding conflicts with main alarm (10 seconds)
export const PENDING_ALARM_CONFLICT_THRESHOLD_MS = 10_000;

// 30 seconds interval in milliseconds
export const THIRTY_MS = 30_000;

export const PENDING_TRANSACTIONS_QUERY = `query ($ids: [ID!]!) {
  transactions(ids: $ids) {
    edges {
      node {
        id
      }
    }
  }
}`;

export const PENDING_AO_TRANSACTIONS_QUERY = `query ($ids: [ID!]!) {
  transactions(
    ids: $ids,
    tags: [{name: "Data-Protocol", values: ["ao"]}]) {
    edges {
      node {
        id
      }
    }
  }
}`;
