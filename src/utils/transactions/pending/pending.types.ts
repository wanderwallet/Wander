import type { ExtendedTransaction } from "~lib/transactions";

export interface PendingTransaction {
  id: string;
  address: string;
  transaction: ExtendedTransaction;
  createdAt: number;
  confirmed?: boolean;
  foundInGraphQL?: boolean;
}

export interface PendingTransactionStats {
  count: number;
  sentBalance: string;
  receivedBalance: string;
}
