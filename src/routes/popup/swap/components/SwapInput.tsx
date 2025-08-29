import { Input, Loading, Text } from "@arconnect/components-rebrand";
import { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import browser from "webextension-polyfill";
import { ChevronDown } from "@untitled-ui/icons-react";
import { TokenLogo } from "~components/popup/TokenLogo";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { useTokenPrice } from "~tokens/hooks";
import { formatBalance } from "~utils/format";
import { useMemo } from "react";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import BigNumber from "bignumber.js";

interface SwapInputProps {
  type: "send" | "receive";
  status?: "default" | "error";
  value: string;
  balance: string;
  balanceLoading: boolean;
  token: TokenInfo;
  onValueChange: (value: string) => void;
  onTokenSwitcherClick: () => void;
  onMaxClick?: () => void;
}

export const SwapInput = ({
  type,
  value,
  balance,
  balanceLoading,
  onValueChange,
  token,
  onTokenSwitcherClick,
  onMaxClick,
  status = "default",
}: SwapInputProps) => {
  const isSend = type === "send";
  const theme = useTheme();
  const [currency = "USD"] = useSetting<string>("currency");
  const { price = 0 } = useTokenPrice(value ? token.processId : undefined, currency);

  const formattedBalance = useMemo(() => formatBalance(balance), [balance]);
  const fiatValue = useMemo(() => {
    if (!value || !price) return "--";
    return `~${formatFiatBalance(BigNumber(value).times(price), currency)}`;
  }, [value, price, currency]);

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = input.value.replace(/[^0-9.]/g, "");
  };

  return (
    <Input
      stacked
      status={status}
      sizeVariant="large"
      disabled={!isSend}
      value={value}
      onInput={handleInputChange}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onValueChange(e.target.value)}
      inputMode="numeric"
      placeholder="0"
      fullWidth
      hasRightIcon
      iconLeft={
        <Text size="sm" noMargin weight="medium" variant="secondary">
          {isSend ? browser.i18n.getMessage("you_send") : browser.i18n.getMessage("you_receive")}
        </Text>
      }
      iconRight={<TokenTag onClick={onTokenSwitcherClick} token={token} iconColor={theme.secondaryText} />}
      inputContainerStyle={{
        background: theme.surfaceTertiary,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexDirection: "column",
        padding: "16px 12px",
        gap: "8px",
        color: value ? theme.primaryText : theme.input.placeholder.search,
      }}
      // @ts-ignore
      inputStyle={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      inputFooter={
        <Flex
          justify="space-between"
          align="center"
          width="100%"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}>
          <Text size="xs" noMargin weight="medium" variant="tertiary">
            {fiatValue}
          </Text>
          <Flex align="center" justify="center" gap={4}>
            {balanceLoading ? (
              <Loading style={{ height: 12, width: 12 }} />
            ) : (
              <Text size="xs" noMargin weight="medium" variant="tertiary">
                {formattedBalance.displayBalance} {token.Ticker}
              </Text>
            )}
            {isSend && (
              <Text
                size="xs"
                noMargin
                weight="medium"
                variant="tertiary"
                style={{ color: "#9787FF", cursor: "pointer" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onMaxClick) {
                    onMaxClick();
                  } else {
                    onValueChange(formattedBalance.tooltipBalance);
                  }
                }}>
                Max
              </Text>
            )}
          </Flex>
        </Flex>
      }
    />
  );
};

const TokenTag = ({ token, iconColor, onClick }: { token: TokenInfo; iconColor: string; onClick: () => void }) => {
  return (
    <Flex align="center" gap={4} onClick={onClick} style={{ marginTop: 20 }}>
      <TokenLogo key={token.processId} token={token || ""} name={token.Name || token.Ticker} size={24} />
      <Text weight="medium" noMargin>
        {token.Ticker}
      </Text>
      <ChevronDown color={iconColor} />
    </Flex>
  );
};
