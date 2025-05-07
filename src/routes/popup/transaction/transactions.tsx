import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "~utils/storage";
import styled from "styled-components";
import { Empty, TitleMessage } from "../notifications";
import { Button, Loading } from "@arconnect/components-rebrand";
import { getFullMonthNameWithYear } from "~lib/transactions";
import { TransactionItemComponent, SectionTitle, SectionList } from "~components/popup/home/Transactions";
import { useTransactions } from "~wallets/hooks";

export function TransactionsView() {
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const { transactions, loading, hasNextPage, fetchTransactions } = useTransactions(activeAddress);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("activity")} />
      <TransactionsWrapper>
        {Object.keys(transactions).length > 0
          ? Object.keys(transactions).map((monthYear) => (
              <SectionList key={monthYear}>
                <SectionTitle>{getFullMonthNameWithYear(monthYear)}</SectionTitle>
                <TransactionItem>
                  {transactions[monthYear].map((transaction) => (
                    <TransactionItemComponent key={transaction.node.id} transaction={transaction} />
                  ))}
                </TransactionItem>
              </SectionList>
            ))
          : !loading && (
              <Empty>
                <TitleMessage>{browser.i18n.getMessage("no_transactions")}</TitleMessage>
              </Empty>
            )}
        {hasNextPage && (
          <Button
            fullWidth
            disabled={!hasNextPage || loading}
            style={{ alignSelf: "center", marginTop: "5px" }}
            onClick={fetchTransactions}>
            {loading ? (
              <>
                Loading <Loading style={{ margin: "0.18rem" }} />
              </>
            ) : (
              "Load more..."
            )}
          </Button>
        )}
      </TransactionsWrapper>
    </>
  );
}

const TransactionsWrapper = styled.div`
  padding: 0px 24px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TransactionItem = styled.div`
  gap: 8px;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
`;
