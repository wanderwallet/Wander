import { Text, Tooltip, type TextProps } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { formatBalance } from "~utils/format";

interface TokenValueWithTooltipProps {
  formattedValue: ReturnType<typeof formatBalance>;
  ticker: string;
  textSize?: TextProps["size"];
}

export function TokenValueWithTooltip({ formattedValue, ticker, textSize = "3xl" }: TokenValueWithTooltipProps) {
  if (!formattedValue || !ticker) return null;

  return formattedValue.showTooltip ? (
    <Tooltip content={formattedValue.tooltipBalance} position="bottom">
      <TokenValue size={textSize}>
        {formattedValue.displayBalance} {ticker}
      </TokenValue>
    </Tooltip>
  ) : (
    <TokenValue size={textSize}>
      {formattedValue.displayBalance} {ticker}
    </TokenValue>
  );
}

const TokenValue = styled(Text).attrs(({ size }) => ({
  size,
  weight: "medium",
  noMargin: true,
}))<{ size: TextProps["size"] }>``;
