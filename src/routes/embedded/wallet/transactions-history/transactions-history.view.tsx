import { Loading } from "@arconnect/components-rebrand";
import { Text, Box, Button } from "~components/embed/ui";
import browser from "~iframe/browser";
import { useActiveWallet, useTransactions } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import TransactionGroup from "../transactions/components/TransactionGroup";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";

export function WalletTransactionsHistoryEmbeddedView() {
  const { address } = useActiveWallet();
  const { navigate } = useLocation();
  const { transactions, loading, hasNextPage, fetchTransactions, count } = useTransactions(address);

  return (
    <AuthRequestCard headerText="Transaction History" onBackButtonClick={() => navigate("/wallet/transactions")}>
      {count.actual > 0 ? (
        <>
          {Object.entries(transactions).map(([monthYear, transactions]) => (
            <TransactionGroup key={monthYear} monthYear={monthYear} transactions={transactions} />
          ))}

          {hasNextPage && (
            <Button isLoading={loading} onClick={fetchTransactions}>
              Load more...
            </Button>
          )}
        </>
      ) : (
        <Box>
          {loading ? (
            <Loading style={{ width: "20px", height: "20px" }} />
          ) : (
            <Text>{browser.i18n.getMessage("no_transactions")}</Text>
          )}
        </Box>
      )}
    </AuthRequestCard>
  );
}
