import { Text, Box, Button } from "~components/embed/ui";
import { useActiveWallet, useTransactions } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { Loading } from "@arconnect/components-rebrand";
import TransactionGroup from "./components/TransactionGroup";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function WalletTransactionsEmbeddedView() {
  const { address } = useActiveWallet();
  const { navigate } = useLocation();
  const { transactions, loading, hasNextPage, count } = useTransactions(address, 3);

  return (
    <AuthRequestCard
      headerText="Transaction History"
      onBackButtonClick={() => navigate("/wallet")}>
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
