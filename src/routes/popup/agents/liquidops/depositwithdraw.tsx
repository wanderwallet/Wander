import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import browser from "webextension-polyfill";
import styled, { useTheme } from "styled-components";
import { Section, Input, Text, Spacer, Button } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import UsdaLogo from "url:/assets/ecosystem/usda.svg";
import LiquidOpsLogo from "url:/assets/ecosystem/liquidops.svg";
import { SvgImageWithBackground } from "../components/SvgImage";
import { MaxButton } from "~routes/popup/send/amount";
import { Line } from "~routes/popup/purchase";
import { LinkExternalIcon, OpenInLiquidops } from "./[agent]";
import { Info } from "../components/liquidops/Info";

export type LiquidOpsDepositWithdrawProps = CommonRouteProps<{ action: "deposit" | "withdraw"; ticker: string }>;

export function LiquidOpsDepositWithdraw({ params: { action, ticker } }: LiquidOpsDepositWithdrawProps) {
  const theme = useTheme();

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
            />
          </InputWrapper>

          <Line />

          <Flex direction="column" gap=".5rem">
            {action === "deposit" && (
              <Flex justify="space-between" style={{ width: "100%" }}>
                <Text size="sm" variant="secondary" weight="medium" noMargin>
                  {browser.i18n.getMessage("estimated_apy")}
                </Text>
                <Text size="sm" weight="medium" noMargin>
                  3.43%
                </Text>
              </Flex>
            )}
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("transaction_fee")}
              </Text>
              <Text size="sm" weight="medium" noMargin>
                0.000001 AO
              </Text>
            </Flex>
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("wander_fee")}
              </Text>
              <Text size="sm" weight="medium" noMargin>
                0.000001 AO
              </Text>
            </Flex>
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("transaction_size")}
              </Text>
              <Text size="sm" weight="medium" noMargin>
                0 B
              </Text>
            </Flex>
            <OpenInLiquidops
              size="sm"
              weight="medium"
              noMargin
              onClick={() =>
                browser.tabs.create({
                  url: `https://liquidops.io/${ticker}`,
                })
              }>
              <SvgImageWithBackground height={14} width={14} shape="circle" src={LiquidOpsLogo} iconSize={14} />
              {browser.i18n.getMessage("liquidops_open")}
              <LinkExternalIcon />
            </OpenInLiquidops>
          </Flex>

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
        <Button variant="primary" fullWidth>
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
