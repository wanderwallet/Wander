import { Loading } from "@arconnect/components-rebrand";
import { Text, Box, Button, AuthRequestCard } from "@wanderapp/ui";
import browser from "webextension-polyfill";
import { useActiveWallet, useLocation, useTransactions } from "@wanderapp/core";
import { TransactionGroup } from "../transactions/components/TransactionGroup";

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
              {browser.i18n.getMessage("load_more")}...
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
