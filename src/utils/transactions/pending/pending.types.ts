import type { ExtendedTransaction } from "~lib/transactions";

export interface PendingTransaction {
  id: string;
  address: string;
  transaction: ExtendedTransaction;
  createdAt: number;
  foundInGraphQL?: boolean;
}

export interface PendingTransactionStats {
  count: number;
  sentBalance: string;
  receivedBalance: string;
}
