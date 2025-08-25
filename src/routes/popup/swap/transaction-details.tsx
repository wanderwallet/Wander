import styled, { useTheme } from "styled-components";
import { Button, Section } from "@arconnect/components-rebrand";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { Flex } from "~components/common/Flex";
import { Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { TokenValueWithTooltip } from "./components/TokenValueWithTooltip";
import { HorizontalLine } from "~components/HorizontalLine";
import { TokenLogo } from "~components/popup/TokenLogo";
import { AutoTag } from "./components/AutoTag";
import { TransactionDetailItem } from "./components/TransactionDetailItem";
import { getPriceImpactColor } from "./utils/swap.utils";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import { AO_TOKEN_INFO, WAR_TOKEN_INFO } from "~tokens/aoTokens/ao.constants";
import { useMemo } from "react";
import { formatBalance } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";

export interface SwapTransactionDetailsParams {
  id: string;
}

export type SwapTransactionDetailsViewProps = CommonRouteProps<SwapTransactionDetailsParams>;

export function SwapTransactionDetailsView({}: SwapTransactionDetailsViewProps) {
  const theme = useTheme();
  const { back } = useLocation();

  const valueInFormatted = useMemo(() => formatBalance("1"), []);
  const valueOutFormatted = useMemo(() => formatBalance("11.8758"), []);
  const slippage = 0.5;
  const priceImpact = "0.5";

  return (
    <>
      <HeadV2 title="Transaction details" />
      <Wrapper>
        <WrapperContent>
          <Flex direction="column" gap={16}>
            <Flex direction="column" gap={8}>
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                {browser.i18n.getMessage("you_send")}
              </Text>
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={AO_TOKEN_INFO} />
                <TokenValueWithTooltip formattedValue={valueInFormatted} ticker={AO_TOKEN_INFO.Ticker} />
              </Flex>
            </Flex>
            <Flex direction="column" gap={8}>
              <Text variant="secondary" size="sm" weight="medium" noMargin>
                {browser.i18n.getMessage("you_receive")}
              </Text>
              <Flex direction="row" align="center" gap={4}>
                <TokenLogo size={24} token={WAR_TOKEN_INFO} />
                <TokenValueWithTooltip formattedValue={valueOutFormatted} ticker={WAR_TOKEN_INFO.Ticker} />
              </Flex>
            </Flex>
          </Flex>
          <HorizontalLine />
          <Flex direction="column" gap={16}>
            <Text weight="medium" noMargin>
              Transactions details
            </Text>
            <Flex direction="column" gap={8}>
              <TransactionDetailItem title={"Rate"} value="1 wAR ≈ 11.8758 AGENT" />
              <TransactionDetailItem title={"Provider"} value="Botega" />
              <TransactionDetailItem title={"Est. Swap Time"} value="15s" />
              <TransactionDetailItem title={"Fees"} value="0.01 AR" />
              <TransactionDetailItem
                title={"Slippage"}
                value={
                  <Flex gap={4} align="center" justify="center">
                    <Text variant="secondary" size="sm" weight="medium" noMargin>
                      {slippage}%{" "}
                    </Text>
                    <AutoTag slippage={slippage} />
                  </Flex>
                }
              />
              <TransactionDetailItem
                title={"Price Impact"}
                value={priceImpact ? `${priceImpact}%` : "--"}
                valueColor={getPriceImpactColor(priceImpact, theme)}
              />
            </Flex>
          </Flex>
        </WrapperContent>

        <Flex direction="column" gap={12}>
          <Button fullWidth onClick={() => back()}>
            {browser.i18n.getMessage("done")}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => browser.tabs.create({ url: "https://ao.link/tx/1" })}>
            {true ? "AOLink" : "Viewblock"}
            <LinkExternal02 style={{ marginLeft: "8px" }} />
          </Button>
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: calc(100vh - 100px);
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  gap: 24px;
`;

const WrapperContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;
