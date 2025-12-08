import { Tooltip } from "@arconnect/components-rebrand";
import { useMemo } from "react";
import styled from "styled-components";
import clockwiseIcon from "url:/assets/icons/clockwise.svg";
import { getTokenPendingTransactionsStats } from "~utils/transactions";

interface PendingTransactionsTooltipProps {
  tokenId: string;
  denomination: number;
  ticker: string;
}

interface PendingContentProps {
  count: number;
  balance: string;
  ticker: string;
}

export function PendingTransactionsTooltip({ tokenId, denomination, ticker }: PendingTransactionsTooltipProps) {
  const { count, balance } = useMemo(
    () => getTokenPendingTransactionsStats(tokenId, denomination),
    [tokenId, denomination],
  );

  if (count === 0 || !denomination) return null;

  return (
    <Tooltip content={<PendingContent count={count} balance={balance} ticker={ticker} />} position="top">
      <PendingIcon src={clockwiseIcon} alt="Pending" />
    </Tooltip>
  );
}

function PendingContent({ count, balance, ticker }: PendingContentProps) {
  return (
    <div
      style={{
        fontSize: "12px",
        textAlign: "center",
        maxWidth: "200px",
        whiteSpace: "normal",
        wordWrap: "break-word",
      }}>
      {count} pending txs. Total amount pending: {balance} {ticker}
    </div>
  );
}

const PendingIcon = styled.img`
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) ${({ theme }) => `invert(${theme.displayTheme === "dark" ? "1" : "0"})`};
  cursor: pointer;
`;
