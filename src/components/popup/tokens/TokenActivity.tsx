import { useActiveAddress, useTokenTransactions } from "~wallets/hooks";
import { TierTransactionItemComponent } from "../home/Transactions";
import styled from "styled-components";
import { Loading, Button, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import browser from "webextension-polyfill";

interface TokenActivityProps {
  id: string;
}

export function TokenActivity({ id }: TokenActivityProps) {
  const activeAddress = useActiveAddress();
  const { transactions, loading, hasNextPage, fetchTransactions } = useTokenTransactions(activeAddress, id);

  return (
    <Flex direction="column" gap={8}>
      <Text variant="secondary" weight="medium" noMargin>
        {browser.i18n.getMessage("activity")}
      </Text>
      <TransactionsWrapper gap={8}>
        {transactions.length > 0 ? (
          transactions.map((transaction) => (
            <TierTransactionItemComponent key={transaction.node.id} transaction={transaction} />
          ))
        ) : (
          <Empty>
            {loading ? (
              <Loading style={{ height: "20px", width: "20px" }} />
            ) : (
              <TitleMessage>{browser.i18n.getMessage("no_activity_yet")}</TitleMessage>
            )}
          </Empty>
        )}
        {hasNextPage && (
          <Button
            fullWidth
            disabled={!hasNextPage || loading}
            style={{ alignSelf: "center", marginTop: "5px" }}
            onClick={fetchTransactions}>
            {loading ? <Loading style={{ margin: "0.18rem" }} /> : browser.i18n.getMessage("load_more") + "..."}
          </Button>
        )}
      </TransactionsWrapper>
    </Flex>
  );
}

const TransactionsWrapper = styled.div<{ gap?: number }>`
  display: flex;
  flex-direction: column;
  gap: ${({ gap }) => gap ?? 12}px;
`;

const Empty = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const TitleMessage = styled(Text).attrs({
  weight: "semibold",
  noMargin: true,
})``;
