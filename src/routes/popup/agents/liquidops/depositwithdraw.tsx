import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { Section, Input, Text, Spacer, Button } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import UsdaLogo from "url:/assets/ecosystem/usda.svg";
import { SvgImageWithBackground } from "../components/SvgImage";
import { MaxButton } from "~routes/popup/send/amount";
import { Line } from "~routes/popup/purchase";
import { Info } from "../components/liquidops/Info";
import { AgentStats } from "../components/liquidops/AgentStats";
import { useLocation } from "~wallets/router/router.utils";
import { tokenData } from "liquidops";
import { useLOSupplyAPY } from "./utils/hooks/useLOSupplyAPY";
import { useMemo } from "react";

export type LiquidOpsDepositWithdrawProps = CommonRouteProps<{ action: "deposit" | "withdraw"; ticker: string }>;

export function LiquidOpsDepositWithdraw({ params: { action, ticker } }: LiquidOpsDepositWithdrawProps) {
  const theme = useTheme();
  const { navigate } = useLocation();

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [activeTokens, ticker],
  );

  const { data: supplyAPR } = useLOSupplyAPY(token.ticker);

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
              //value={purchaseAmount}
              //onInput={handleInputChange}
              //onChange={(e) => handleAmountChange(e.target.value)}
              inputMode="numeric"
              placeholder="0"
              fullWidth
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
                    <SvgImageWithBackground height={22} width={22} shape="circle" src={UsdaLogo} iconSize={22} />
                    <Text size="base" noMargin weight="medium">
                      {action === "withdraw" && "o"}
                      {ticker}
                    </Text>
                  </Flex>
                  <MaxButton>MAX</MaxButton>
                  <Text
                    size="sm"
                    variant="secondary"
                    noMargin
                    weight="medium"
                    style={{ position: "absolute", left: 10, bottom: 10 }}>
                    ~$10.00
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
        <Button variant="primary" fullWidth onClick={() => navigate(`/agents/liquidops/${ticker}/${action}/confirm`)}>
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
