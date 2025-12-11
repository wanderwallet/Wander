import { Tooltip } from "@arconnect/components-rebrand";
import styled from "styled-components";
import clockwiseIcon from "url:/assets/icons/clockwise.svg";
import { useTokenPendingTransactionsStats } from "~utils/transactions/pending/pending.hooks";
import browser from "webextension-polyfill";

interface PendingTransactionsTooltipProps {
  tokenId: string;
  ticker: string;
}

interface PendingContentProps {
  count: number;
  balance: string;
  ticker: string;
}

export function PendingTransactionsTooltip({ tokenId, ticker }: PendingTransactionsTooltipProps) {
  const { count, balance } = useTokenPendingTransactionsStats(tokenId);

  if (count === 0) return null;

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
      {browser.i18n.getMessage("pending_transactions_message", [
        count.toString(),
        count > 1 ? browser.i18n.getMessage("tx_plural") : browser.i18n.getMessage("tx_singular"),
        balance,
        ticker,
      ])}
    </div>
  );
}

const PendingIcon = styled.img`
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) ${({ theme }) => `invert(${theme.displayTheme === "dark" ? "1" : "0"})`};
  cursor: pointer;
`;
