import { Tooltip, Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import clockwiseIcon from "url:/assets/icons/clockwise.svg";
import {
  useTokenPendingTransactionsStats,
  usePendingTransactionsMessage,
} from "~utils/transactions/pending/pending.hooks";

interface PendingTransactionsTooltipProps {
  tokenId: string;
  ticker: string;
}

export function PendingTransactionsTooltip({ tokenId, ticker }: PendingTransactionsTooltipProps) {
  const { count, sentBalance, receivedBalance } = useTokenPendingTransactionsStats(tokenId);
  const message = usePendingTransactionsMessage(count, sentBalance, receivedBalance, ticker);

  if (count === 0 || !message) return null;

  return (
    <Tooltip
      content={
        <Text
          size="sm"
          style={{
            textAlign: "center",
            maxWidth: "200px",
            whiteSpace: "normal",
            wordWrap: "break-word",
          }}
          noMargin>
          {message}
        </Text>
      }
      position="top">
      <PendingIcon src={clockwiseIcon} alt="Pending" />
    </Tooltip>
  );
}

const PendingIcon = styled.img`
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) ${({ theme }) => `invert(${theme.displayTheme === "dark" ? "1" : "0"})`};
  cursor: pointer;
`;
