import { AlertTriangle } from "@untitled-ui/icons-react";
import styled, { useTheme } from "styled-components";
import { AO_PROCESS_ID, VERIFIED_TOKENS } from "~tokens/aoTokens/ao";
import { formatFiatBalance } from "~tokens/currency";
import { useAoToken } from "~tokens/hooks";
import { useTokenPriceChange } from "~tokens/hooks/useTokenPriceChange";
import { useFormattedTokenBalance } from "~tokens/hooks/useFormattedTokenBalance";
import useSetting from "~settings/hook";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import Skeleton from "~components/Skeleton";
import TriangleIcon from "~components/icons/TriangleIcon";
import VerifiedIcon from "~components/icons/VerifiedIcon";
import { Flex } from "~components/common/Flex";
import { useMemo } from "react";
import { PriceChart } from "./PriceChart";
import { ActiveAgentsSlider } from "./ActiveAgentsSlider";
import { TokenActionButtons } from "./TokenActionButtons";

interface TokenInfoProps {
  id: string;
}

const HYPHEN = "\u2011\u2011";

export const TokenInfo = ({ id }: TokenInfoProps) => {
  const isAR = id === "AR";
  const isAO = id === AO_PROCESS_ID;
  const [currency = "USD"] = useSetting("currency");
  const token = useAoToken(id);
  const theme = useTheme();
  const formattedBalance = useFormattedTokenBalance(id);
  const tokenPriceChange = useTokenPriceChange(isAR ? "arweave" : isAO ? "ao-computer" : null, formattedBalance?.fiat);

  const tokenData = useMemo(
    () => ({
      ...formattedBalance,
      ...(formattedBalance.fiat !== null ? tokenPriceChange : { loading: false, percentage: null, fiatChange: null }),
      loading: formattedBalance.loading,
    }),
    [formattedBalance, tokenPriceChange],
  );

  const tokenDisplay = useMemo(
    () => ({
      displayBalance: tokenData?.loading ? null : tokenData?.displayBalance || "0",
      fiatBalance: tokenData?.loading ? null : tokenData?.fiatBalance || HYPHEN,
      percentage: tokenData?.loading ? null : tokenData?.percentage?.toNumber() || 0,
      fiatChange:
        tokenData?.loading || !tokenData?.fiatBalance || !tokenData?.percentage
          ? null
          : formatFiatBalance(
              ((tokenData.percentage?.toNumber() ?? 0) / 100) *
                parseFloat(tokenData.fiatBalance.replace(/[^0-9.-]+/g, "")),
              currency,
            ),
      ticker: token?.Ticker,
      loading: tokenData?.loading,
    }),
    [tokenData, token],
  );

  const verified = VERIFIED_TOKENS.includes(id as (typeof VERIFIED_TOKENS)[number]);
  const tokenDescription = browser.i18n.getMessage(`token_description_${id.replaceAll("-", "_")}`);

  return (
    <Flex direction="column" gap={24}>
      <TokenInfoItem>
        <TokenInfoLabel>{browser.i18n.getMessage("your_balance")}</TokenInfoLabel>
        <TokenBalance>
          <TokenBalanceText>
            {tokenDisplay.loading ? (
              <Skeleton width="80px" height="32px" />
            ) : (
              <>
                {tokenDisplay.displayBalance}
                <TokenBalanceUnit>{tokenDisplay.ticker}</TokenBalanceUnit>
              </>
            )}
          </TokenBalanceText>
          <Flex direction="row" gap={8} justify="center">
            <FiatBalanceText>{tokenDisplay.fiatBalance}</FiatBalanceText>
            {(isAR || isAO) &&
              tokenDisplay.percentage !== undefined &&
              tokenDisplay.percentage !== null &&
              tokenDisplay.fiatChange && (
                <Flex gap={4} align="center">
                  <FiatBalanceText variant="secondary">
                    {tokenDisplay.percentage > 0 && "+"}
                    {tokenDisplay.fiatChange} ({Math.abs(tokenDisplay.percentage).toFixed(2)}%)
                  </FiatBalanceText>
                  <TriangleIcon
                    negative={tokenDisplay.percentage < 0}
                    color={tokenDisplay.percentage < 0 ? theme.fail : theme.success}
                  />
                </Flex>
              )}
          </Flex>
        </TokenBalance>
      </TokenInfoItem>
      <TokenActionButtons id={id} />
      <ActiveAgentsSlider id={id} />
      {(isAR || isAO) && <PriceChart symbol={isAR ? "arweave" : "ao-computer"} />}
      {tokenDescription ? (
        <>
          <Flex direction="column" gap={8}>
            <Text variant="secondary" weight="medium" noMargin>
              {browser.i18n.getMessage("about")}
            </Text>
            <Text weight="medium" noMargin>
              {tokenDescription}
            </Text>
          </Flex>
          {verified && (
            <Flex
              direction="row"
              align="center"
              gap={4}
              padding="4px 8px"
              borderRadius={12}
              background={theme.primary}
              maxWidth="fit-content">
              <VerifiedIcon color="white" />
              <Text size="xs" weight="semibold" noMargin>
                {browser.i18n.getMessage("verified")}
              </Text>
            </Flex>
          )}
        </>
      ) : (
        <Flex
          direction="row"
          align="center"
          gap={16}
          borderRadius={8}
          padding={16}
          background={theme.backgroundSecondary}>
          <AlertTriangle
            style={{ height: 24, width: 24, flexShrink: 0 }}
            color={theme.displayTheme === "dark" ? "#EDD44F" : "#F5A623"}
          />
          <Text size="sm" weight="semibold" noMargin>
            {browser.i18n.getMessage("unknown_coin")}
          </Text>
        </Flex>
      )}
    </Flex>
  );
};
const TokenInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

const TokenBalance = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
`;

const TokenInfoLabel = styled(Text).attrs({ noMargin: true, weight: "medium", variant: "secondary" })``;

const TokenBalanceText = styled(Text).attrs({ noMargin: true, size: "3xl", weight: "medium" })`
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 4px;
`;

const FiatBalanceText = styled(Text).attrs({ noMargin: true, weight: "medium" })``;

const TokenBalanceUnit = styled(Text).attrs({ noMargin: true, weight: "medium" })``;
