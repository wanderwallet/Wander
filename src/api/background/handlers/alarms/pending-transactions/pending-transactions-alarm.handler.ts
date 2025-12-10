import { type Alarms } from "webextension-polyfill";
import { checkAndCleanPendingTransactions } from "~utils/transactions/pending/pending.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  PENDING_TRANSACTIONS_ALARM_NAME,
  AO_PENDING_CLEANUP_ALARM_NAME_PREFIX,
} from "~utils/transactions/pending/pending.constants";

/**
 * Handle pending transactions cleanup alarm
 * Checks and removes pending transactions that are now confirmed in GraphQL
 */
export async function handlePendingTransactionsAlarm(alarm?: Alarms.Alarm) {
  if (
    alarm?.name !== PENDING_TRANSACTIONS_ALARM_NAME &&
    !alarm?.name.startsWith(AO_PENDING_CLEANUP_ALARM_NAME_PREFIX)
  ) {
    return;
  }

  try {
    await checkAndCleanPendingTransactions();
    log(LOG_GROUP.TRANSACTIONS, "Pending transactions cleanup completed");
  } catch (error) {
    log(LOG_GROUP.TRANSACTIONS, "Error in pending transactions alarm:", error);
  }
}

export { schedulePendingTransactionsCleanupAlarm } from "~utils/transactions/pending/pending.alarms";
