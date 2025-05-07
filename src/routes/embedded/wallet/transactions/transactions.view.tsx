import { Card, Text, Box, Button } from "~components/embed/ui";
import { useActiveWallet, useTransactions } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { Loading } from "@arconnect/components-rebrand";
import TransactionGroup from "./components/TransactionGroup";

export function WalletTransactionsEmbeddedView() {
  const { address } = useActiveWallet();
  const { navigate } = useLocation();
  const { transactions, loading, hasNextPage, count } = useTransactions(address, 3);

  return (
    <Card
      size="auto"
      headerText="Transaction History"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "2rem", overflowY: "auto" }}>
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
    </Card>
  );
}
