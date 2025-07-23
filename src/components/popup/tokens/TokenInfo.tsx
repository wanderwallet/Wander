import { Feather, QrCode02 } from "@untitled-ui/icons-react";
import styled, { useTheme } from "styled-components";
import { VERIFIED_TOKENS } from "~tokens/aoTokens/ao";
import { formatFiatBalance } from "~tokens/currency";
import { useAoToken, useTokenBalance, useTokenPrice } from "~tokens/hooks";
import { useArChange } from "~tokens/hooks/useArChange";
import { useFormattedArBalance } from "~tokens/hooks/useFormattedArBalance";
import { useActiveAddress } from "~wallets/hooks";
import PriceChart from "../asset/PriceChart";
import useSetting from "~settings/hook";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import Skeleton from "~components/Skeleton";
import TriangleIcon from "~components/icons/TriangleIcon";
import VerifiedIcon from "~components/icons/VerifiedIcon";
import { Flex } from "~components/common/Flex";
import { useMemo } from "react";
import { ReceiveIcon } from "~components/icons/ReceiveIcon";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { ActionButtons, type ButtonConfig } from "../ActionButtons";
import arLogoDark from "url:/assets/ar/logo_dark.png";

interface TokenInfoProps {
  id: string;
}

const HYPHEN = "\u2011\u2011";

export const TokenInfo: React.FC<TokenInfoProps> = ({ id }) => {
  const activeAddress = useActiveAddress();
  const [currency = "USD"] = useSetting("currency");
  const token = useAoToken(id);
  const theme = useTheme();

  const isAR = id === "AR";

  const { data: balance = "0" } = useTokenBalance(token, activeAddress!);

  // AR Hooks
  const formattedBalance = useFormattedArBalance();

  const arChange = useArChange(formattedBalance.fiat);

  const arData = isAR
    ? {
        ...formattedBalance,
        ...(formattedBalance.fiat !== null ? arChange : { loading: false, percentage: null, fiatChange: null }),
        loading: formattedBalance.loading,
      }
    : null;

  // AO Hooks
  const { price } = useTokenPrice(id, currency);

  const tokenDisplay = isAR
    ? {
        displayBalance: arData?.loading ? null : arData?.displayBalance,
        fiatBalance: arData?.loading ? null : arData?.fiatBalance,
        percentage: arData?.loading ? null : arData?.percentage?.toNumber(),
        fiatChange:
          arData?.loading || !arData?.fiatBalance
            ? null
            : formatFiatBalance(
                ((arData.percentage?.toNumber() ?? 0) / 100) * parseFloat(arData.fiatBalance.replace(/[^0-9.-]+/g, "")),
                currency,
              ),
        ticker: "AR",
        loading: arData?.loading,
      }
    : {
        displayBalance: balance || "0",
        fiatBalance:
          price && +balance! >= 0 ? formatFiatBalance(BigNumber(balance!).multipliedBy(price), currency) : HYPHEN,
        ticker: token?.Ticker,
        loading: !isAR && !balance,
      };

  const verified = VERIFIED_TOKENS.includes(id as (typeof VERIFIED_TOKENS)[number]);
  const hasDescription = browser.i18n.getMessage(`token_descriptions.${id}`);

  const buttons = useMemo<ButtonConfig[]>(
    () => [
      {
        text: browser.i18n.getMessage("buy_ar_button"),
        icon: <img src={arLogoDark} style={{ height: 18.5, width: 18.5 }} alt="Buy AR" />,
        href: "/purchase",
        variant: "primary",
        iconPosition: "right",
      },
      {
        text: "",
        icon: <ReceiveIcon flipped={true} />,
        href: "/send/transfer",
        variant: "secondary",
      },
      {
        text: "",
        icon: <QrCode02 style={{ height: 26, width: 26 }} />,
        href: "/receive",
        variant: "secondary",
      },
    ],
    [],
  );

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
            {isAR &&
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

      <ActionButtons buttons={buttons} />

      {/* {isAR && <PriceChart />} */}

      {hasDescription ? (
        <>
          <div style={{ gap: 8 }}>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "JakartaMedium",
                lineHeight: 20.8,
              }}>
              {browser.i18n.getMessage("menu.about")}
            </Text>
            <Text
              style={{
                fontSize: 16,
                fontFamily: "JakartaMedium",
                lineHeight: 20.8,
              }}>
              {browser.i18n.getMessage(`token_descriptions.${id}`)}
            </Text>
          </div>
          {verified && (
            <div
              style={{
                flexDirection: "row",
                alignSelf: "flex-start",
                gap: 4,
                padding: "4px 8px",
                borderRadius: 50,
                alignItems: "center",
              }}>
              <VerifiedIcon />
              <Text
                style={{
                  color: "#fff",
                  fontSize: 12,
                  fontFamily: "ManropeSemiBold",
                }}>
                {browser.i18n.getMessage("token_information.verified")}
              </Text>
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            gap: 16,
            borderRadius: 8,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
          }}>
          <Feather name="alert-triangle" />
          <Text
            style={{
              fontSize: 14,
              fontFamily: "ManropeSemiBold",
              flex: 1,
            }}>
            {browser.i18n.getMessage("unknown_coin")}
          </Text>
        </div>
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
