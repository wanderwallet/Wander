import { Tooltip } from "@arconnect/components-rebrand";
import styled from "styled-components";
import clockwiseIcon from "url:/assets/icons/clockwise.svg";

export function PendingTransactionsTooltip({ count, total, ticker }: { count: number; total: string; ticker: string }) {
  if (count > 0) {
    return (
      <Tooltip content={<PendingContent count={count} total={total} ticker={ticker} />} position="top">
        <PendingIcon src={clockwiseIcon} alt="Pending" />
      </Tooltip>
    );
  }

  return null;
}

function PendingContent({ count, total, ticker }: { count: number; total: string; ticker: string }) {
  return (
    <div
      style={{
        fontSize: "12px",
        textAlign: "center",
        maxWidth: "200px",
        whiteSpace: "normal",
        wordWrap: "break-word",
      }}>
      {count} of pending txs. Total amount pending: {total} {ticker}
    </div>
  );
}

const PendingIcon = styled.img`
  width: 16px;
  height: 16px;
  filter: brightness(0) saturate(100%) ${({ theme }) => `invert(${theme.displayTheme === "dark" ? "1" : "0"})`};
`;
