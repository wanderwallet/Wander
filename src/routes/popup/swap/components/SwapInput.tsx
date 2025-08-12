import { Input, Loading, Text } from "@arconnect/components-rebrand";
import { useTheme } from "styled-components";
import { Flex } from "~components/common/Flex";
import browser from "webextension-polyfill";
import { ChevronDown } from "@untitled-ui/icons-react";
import { TokenLogo } from "~components/popup/TokenLogo";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { useTokenBalance, useTokenPrice } from "~tokens/hooks";
import { useActiveAddress } from "~wallets/hooks";
import { formatBalance } from "~utils/format";
import { useMemo } from "react";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import BigNumber from "bignumber.js";

interface SwapInputProps {
  type: "send" | "receive";
  amount: string;
  token: TokenInfo;
  onAmountChange: (value: string) => void;
  onTokenSwitcherClick: () => void;
}

export const SwapInput = ({ type, amount, onAmountChange, token, onTokenSwitcherClick }: SwapInputProps) => {
  const isSend = type === "send";
  const theme = useTheme();
  const [currency] = useSetting<string>("currency");
  const activeAddress = useActiveAddress();
  const { data: balance = "0", isLoading } = useTokenBalance(isSend ? token : null, activeAddress);
  const { price = 0 } = useTokenPrice(amount ? token.processId : undefined, currency);

  const formattedBalance = useMemo(() => formatBalance(balance), [balance]);
  const fiatBalance = useMemo(
    () => formatFiatBalance(BigNumber(balance || "0").times(price || 0), currency),
    [balance, price, currency],
  );

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = input.value.replace(/[^0-9.]/g, "");
  };

  return (
    <Input
      stacked
      sizeVariant="large"
      disabled={!isSend}
      value={amount}
      onInput={handleInputChange}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onAmountChange(e.target.value)}
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
        padding: "12px",
        gap: "8px",
        color: amount ? theme.primaryText : theme.input.placeholder.search,
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
            ~{fiatBalance}
          </Text>
          <Flex align="center" justify="center" gap={4}>
            {isLoading ? (
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
                  onAmountChange(formattedBalance.tooltipBalance);
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
