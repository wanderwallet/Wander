import { Text, Box, Button, AuthRequestCard } from "@wanderapp/ui";
import { useActiveWallet, useLocation, useTransactions } from "@wanderapp/core";
import browser from "webextension-polyfill";
import { Loading } from "@arconnect/components-rebrand";
import { EmbeddedPaths } from "../../../router/dashboard/iframe.routes";
import { TransactionGroup } from "./components/TransactionGroup";

export function WalletTransactionsEmbeddedView() {
  const { address } = useActiveWallet();
  const { navigate } = useLocation();
  const { transactions, loading, hasNextPage, count } = useTransactions(address, 3);

  return (
    <AuthRequestCard
      headerText="Transaction History"
      onBackButtonClick={() => navigate(EmbeddedPaths.WalletHomeEmbeddedView)}>
      {count.current > 0 ? (
        Object.entries(transactions).map(([monthYear, transactions]) => (
          <TransactionGroup key={monthYear} monthYear={monthYear} transactions={transactions} />
        ))
      ) : (
        <Box>
          {loading ? (
            <Loading style={{ width: "20px", height: "20px" }} />
          ) : (
            <Text>{browser.i18n.getMessage("no_transactions")}</Text>
          )}
        </Box>
      )}

      {!loading && (count.actual > 3 || hasNextPage) && (
        <Button variant="link" href="/wallet/transactions-history">
          View all transactions
        </Button>
      )}
    </AuthRequestCard>
  );
}
