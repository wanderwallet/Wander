import { Loading } from "@arconnect/components-rebrand";
import { Card, Text, Box, Button } from "~components/embed/ui";
import browser from "~iframe/browser";
import { useActiveWallet, useTransactions } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import TransactionGroup from "../transactions/components/TransactionGroup";

export function WalletTransactionsHistoryEmbeddedView() {
  const { address } = useActiveWallet();
  const { navigate } = useLocation();
  const { transactions, loading, hasNextPage, fetchTransactions, count } =
    useTransactions(address);

  return (
    <Card
      size="auto"
      headerText="Transaction History"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet/transactions")}
      style={{ padding: "2rem", overflowY: "auto" }}
    >
      {count.actual > 0 ? (
        Object.entries(transactions).map(([monthYear, transactions]) => (
          <TransactionGroup
            key={monthYear}
            monthYear={monthYear}
            transactions={transactions}
          />
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

      {hasNextPage && (
        <Button isLoading={loading} onClick={fetchTransactions}>
          Load more...
        </Button>
      )}
    </Card>
  );
}
