import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { Section, Input, Text, Spacer, Button } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../components/SvgImage";
import { AmountValidationState, getErrorMessage, MaxButton, validateAmount } from "~routes/popup/send/amount";
import { Line } from "~routes/popup/purchase";
import { Info } from "../components/liquidops/Info";
import { AgentStats } from "../components/liquidops/AgentStats";
import { useLocation } from "~wallets/router/router.utils";
import { tokenData } from "liquidops";
import { useLOSupplyAPY } from "./utils/hooks/useLOSupplyAPY";
import { useMemo, useState } from "react";
import { useTokenBalance, useTokenPrice } from "~tokens/hooks";
import { useActiveWallet } from "~wallets/hooks";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import BigNumber from "bignumber.js";
import { useGateway } from "./utils/hooks/useGateway";
import useSetting from "~settings/hook";
import { formatFiatBalance, formatTokenBalance } from "~tokens/currency";
import { useOExchangeRate } from "./utils/hooks/useOExchangeRate";

export type LiquidOpsDepositWithdrawProps = CommonRouteProps<{ action: "deposit" | "withdraw"; ticker: string }>;

export function LiquidOpsDepositWithdraw({ params: { action, ticker } }: LiquidOpsDepositWithdrawProps) {
  const theme = useTheme();
  const { navigate } = useLocation();

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [activeTokens, ticker],
  );
  const tokenInfo = useMemo<TokenInfo>(
    () => ({
      processId: action === "deposit" ? token.address : token.oAddress,
      Denomination: Number(action === "deposit" ? token.baseDenomination : token.denomination),
    }),
    [token],
  );
  const { data: tokenIconUrl } = useGateway(action === "deposit" ? token.icon : token.oIcon);

  const { data: supplyAPR = 0 } = useLOSupplyAPY(token.ticker);

  // active address
  const wallet = useActiveWallet();

  // input

  // otoken or asset balance
  const { data: balance = "0" } = useTokenBalance(tokenInfo, wallet?.address);

  // validation and qty
  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = input.value.replace(/[^0-9.]/g, "");
  };

  const [quantity, setQuantity] = useState("");

  const amountValidationState = useMemo(() => {
    return validateAmount(quantity, balance, "0", "token", 0);
  }, [quantity, balance]);

  const invalidQty = useMemo(
    () =>
      amountValidationState !== AmountValidationState.Valid && amountValidationState !== AmountValidationState.Empty,
    [amountValidationState],
  );

  // token worth
  const [currency] = useSetting<string>("currency");
  const { price = 0 } = useTokenPrice(token.address, currency);

  const { data: exchangeRate = BigNumber(0) } = useOExchangeRate(token?.ticker, quantity);

  const tokenWorth = useMemo(() => {
    const qtyParsed = BigNumber(quantity || "0");

    if (action === "deposit") return qtyParsed.multipliedBy(price);
    else return exchangeRate;
  }, [price, quantity, exchangeRate]);

  const submit = () => navigate(`/agents/liquidops/${ticker}/${action}/${quantity}/confirm`);

  // // TODO: create params for the transaction
  // const baseDenomination = getBaseDenomination(ticker.toUpperCase());
  // const params = {
  //   token: ticker.toUpperCase(),
  //   quantity: new Quantity(0n, baseDenomination).fromString(inputValue).raw,
  // };

  return (
    <>
      <HeadV2 title={browser.i18n.getMessage(action) + " " + ticker} />

      <Wrapper>
        <div>
          <InputWrapper>
            <Input
              stacked
              sizeVariant="large"
              value={quantity}
              onInput={handleInputChange}
              onChange={(e) => setQuantity((e.target as HTMLInputElement).value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || invalidQty || parseFloat(quantity) === 0 || quantity === "") return;
                submit();
              }}
              errorMessage={getErrorMessage(amountValidationState)}
              status={invalidQty ? "error" : "default"}
              inputMode="numeric"
              placeholder="0"
              fullWidth
              min="0"
              hasRightIcon
              iconLeft={
                action === "deposit" ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      marginRight: "10px",
                      cursor: "default",
                    }}>
                    <Text size="sm" noMargin weight="medium" variant="secondary">
                      {browser.i18n.getMessage("you_deposit")}
                    </Text>
                  </div>
                ) : undefined
              }
              iconRight={
                <Flex direction="column" align="flex-end" gap="1rem" style={{ cursor: "default", paddingTop: 20 }}>
                  <Flex align="center" gap=".4rem">
                    <SvgImageWithBackground height={22} width={22} shape="circle" src={tokenIconUrl} iconSize={22} />
                    <Text size="base" noMargin weight="medium">
                      {action === "withdraw" && "o"}
                      {ticker}
                    </Text>
                  </Flex>
                  <MaxButton onClick={() => setQuantity(balance)}>MAX</MaxButton>
                  <Text
                    size="sm"
                    variant="secondary"
                    noMargin
                    weight="medium"
                    style={{ position: "absolute", left: 10, bottom: 10 }}>
                    {"~"}
                    {action === "deposit" ? formatFiatBalance(tokenWorth, currency) : formatTokenBalance(tokenWorth)}
                    {action === "withdraw" && " " + token.cleanTicker}
                  </Text>
                </Flex>
              }
              inputContainerStyle={{
                background: theme.surfaceTertiary,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                flexDirection: "column",
                padding: "10px",
              }}
              autoFocus
            />
          </InputWrapper>

          <Line />

          <AgentStats
            ticker={ticker}
            apy={action === "deposit" ? supplyAPR.toLocaleString(undefined, { maximumFractionDigits: 2 }) : undefined} // apy is not defined for withdrawals
            size={0}
            wanderFee={0} // TODO: talk to Clabs
            transactionFee={0} // this is 0 for now
          />

          <Spacer y={1} />

          <Info>
            <Text size="sm" weight="medium" noMargin style={{ lineHeight: "1.4em" }}>
              {browser.i18n.getMessage(
                action === "deposit" ? "deposit_receive" : "withdraw_receive",
                action === "deposit" ? ["o" + ticker, ticker] : [ticker],
              )}
            </Text>
          </Info>
        </div>
        <Button
          variant="primary"
          fullWidth
          disabled={invalidQty || parseFloat(quantity) === 0 || quantity === ""}
          onClick={submit}>
          {browser.i18n.getMessage("continue")}
        </Button>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  justify-content: space-between;
  padding-top: 0px;
`;

const InputWrapper = styled.div`
  div:has(> input) {
    align-items: baseline;
  }
`;
