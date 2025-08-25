import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { Button, Loading, Text } from "@arconnect/components-rebrand";
import { getFullMonthNameWithYear } from "~lib/transactions";
import {
  TransactionItemComponent,
  SectionTitle,
  SectionList,
  AnnouncementItemComponent,
} from "~components/popup/home/Transactions";
import { useActiveAddress, useTransactions } from "~wallets/hooks";
import { FilterLines } from "@untitled-ui/icons-react";
import { useMemo, useState } from "react";
import { FeedFilter, FeedFilterPopup } from "~components/popup/FeedFilterPopup";

export function TransactionsView() {
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FeedFilter>(FeedFilter.NO_FILTERS);
  const activeAddress = useActiveAddress();

  const { transactions, loading, hasNextPage, fetchTransactions } = useTransactions(activeAddress);

  const filteredTransactions = useMemo(() => {
    if (!transactions) return {};
    if (filter === FeedFilter.NO_FILTERS) return transactions;

    return Object.keys(transactions).reduce(
      (acc, monthYear) => {
        const filtered = transactions[monthYear].filter((tx) => {
          const isAnnouncement = tx.transactionType === "announcement";
          return filter === FeedFilter.ANNOUNCEMENTS ? isAnnouncement : !isAnnouncement;
        });

        if (filtered.length > 0) {
          acc[monthYear] = filtered;
        }
        return acc;
      },
      {} as typeof transactions,
    );
  }, [transactions, filter]);

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("feed")} />
      <TransactionsWrapper>
        <Button
          style={{ marginBottom: 4, height: 42 }}
          variant="secondary"
          icon={<FilterLines height={20} width={20} />}
          iconPosition="left"
          onClick={() => setShowFilter(true)}
          fullWidth>
          {browser.i18n.getMessage(
            filter === FeedFilter.NO_FILTERS
              ? "filter"
              : filter === FeedFilter.ANNOUNCEMENTS
                ? "announcements_only"
                : "transactions_only",
          )}
        </Button>
        {Object.keys(filteredTransactions).length > 0
          ? Object.keys(filteredTransactions).map((monthYear) => (
              <SectionList key={monthYear}>
                <SectionTitle>{getFullMonthNameWithYear(monthYear)}</SectionTitle>
                <TransactionItem>
                  {filteredTransactions[monthYear].map((transaction) =>
                    transaction.transactionType === "announcement" ? (
                      <AnnouncementItemComponent key={transaction.node.id} transaction={transaction} />
                    ) : (
                      <TransactionItemComponent key={transaction.node.id} transaction={transaction} />
                    ),
                  )}
                </TransactionItem>
              </SectionList>
            ))
          : !loading && (
              <Empty>
                <TitleMessage>{browser.i18n.getMessage("no_transactions")}</TitleMessage>
              </Empty>
            )}
        {hasNextPage && filter !== FeedFilter.ANNOUNCEMENTS && (
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
              browser.i18n.getMessage("load_more") + "..."
            )}
          </Button>
        )}
      </TransactionsWrapper>
      <FeedFilterPopup isOpen={showFilter} setOpen={setShowFilter} filter={filter} setFilter={setFilter} />
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

const Empty = styled.div`
  width: 100%;
  height: calc(100% - 64.59px);
  margin-top: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TitleMessage = styled(Text).attrs({
  size: "md",
  weight: "medium",
  noMargin: true,
})``;
