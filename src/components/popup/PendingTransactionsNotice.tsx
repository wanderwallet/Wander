import styled from "styled-components";
import { Text } from "@arconnect/components-rebrand";
import clockwiseIcon from "url:/assets/icons/clockwise.svg";
import {
  useTokenPendingTransactionsStats,
  usePendingTransactionsMessage,
} from "~utils/transactions/pending/pending.hooks";

interface PendingTransactionsNoticeProps {
  tokenId: string;
  ticker: string;
}

export function PendingTransactionsNotice({ tokenId, ticker }: PendingTransactionsNoticeProps) {
  const { count, sentBalance, receivedBalance } = useTokenPendingTransactionsStats(tokenId);
  const message = usePendingTransactionsMessage(count, sentBalance, receivedBalance, ticker);

  if (count === 0 || !message) return null;

  return (
    <NoticeWrapper>
      <PendingIcon src={clockwiseIcon} alt="Pending" />
      <Text variant="secondary" size="sm" weight="medium" noMargin>
        {message}
      </Text>
    </NoticeWrapper>
  );
}

const NoticeWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  background: ${(props) =>
    props.theme.displayTheme === "dark" ? "rgba(238, 189, 65, 0.15)" : "rgba(238, 189, 65, 0.12)"};
  border: 1px solid
    ${(props) => (props.theme.displayTheme === "dark" ? "rgba(238, 189, 65, 0.3)" : "rgba(238, 189, 65, 0.25)")};
  margin-bottom: 16px;
  width: fit-content;
`;

const PendingIcon = styled.img`
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  filter: brightness(0) saturate(100%) ${({ theme }) => `invert(${theme.displayTheme === "dark" ? "1" : "0"})`};
`;
