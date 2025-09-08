import { Text, Tooltip, type TextProps, type TooltipProps } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { formatBalance } from "~utils/format";

interface TokenValueWithTooltipProps {
  formattedValue: ReturnType<typeof formatBalance>;
  ticker: string;
  textSize?: TextProps["size"];
  tooltipPosition?: TooltipProps["position"];
}

export function TokenValueWithTooltip({
  formattedValue,
  ticker,
  textSize = "3xl",
  tooltipPosition = "top",
}: TokenValueWithTooltipProps) {
  if (!formattedValue || !ticker) return null;

  return formattedValue.showTooltip ? (
    <Tooltip content={formattedValue.tooltipBalance} position={tooltipPosition}>
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
}))<{ size: TextProps["size"] }>`
  word-break: break-word;
  overflow-wrap: break-word;
`;
