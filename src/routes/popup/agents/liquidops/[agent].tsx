import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { Button, Section, Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import { SvgImageWithBackground } from "../components/SvgImage";
import { Spacer } from "~components/embed";
import dayjs from "dayjs";
import { StatusLabel } from "../components/StatusLabel";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { LinkExternalIcon, OpenInLiquidops } from "../components/liquidops/AgentStats";
import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";
import useSetting from "~settings/hook";
import { useStorage } from "~utils/storage";
import { PersistentStorage } from "~utils/storage";
import { tokenData } from "liquidops";
import { findGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import { useTokenBalance } from "~tokens/hooks";
import { useLiquidOpsSupplyAPY } from "./utils/useLiquidOpsSupplyAPY";

export type LiquidOpsAgentProps = CommonRouteProps<{ ticker: string }>;

export function LiquidOpsAgent({ params: { ticker } }: LiquidOpsAgentProps) {
  // router
  const { navigate } = useLocation();

  // balance on liquidops (oToken worth)
  const [agentBalance, setAgentBalance] = useState(0);

  // balance in local currency
  const [currency] = useSetting<string>("currency");
  const [fiatBalance, setFiatBalance] = useState(0);

  // TODO
  useEffect(() => {
    setTimeout(() => {
      setAgentBalance(10);
      setFiatBalance(10);
    }, 1500);
  }, []);

  // balance display
  const [hideBalance, setHideBalance] = useStorage<boolean>(
    {
      key: "hide_balance",
      instance: PersistentStorage,
    },
    false,
  );

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const token = activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());

  const gateway = {
    host: "arweave.net",
    port: 443,
    protocol: "https",
  }; // TODO: await findGateway({ graphql: true });
  const gatewayUrl = concatGatewayURL(gateway);

  const tokenObj = {
    Name: token.name,
    Denomination: Number(token.denomination),
    processId: token.oAddress,
  };
  const oTokenBalance = useTokenBalance(tokenObj, token.oAddress);

  const supplyAPR = useLiquidOpsSupplyAPY(token.ticker);

  const earnedInterest = 1;

  return (
    <>
      <HeadV2 title={ticker + " " + browser.i18n.getMessage("agent")} />

      <Wrapper>
        <Flex align="center" direction="column" gap={2}>
          <Text size="base" variant="secondary" weight="medium" noMargin>
            {browser.i18n.getMessage("deposited")}
          </Text>
          <Balances align="center" direction="column" gap={4} blur={hideBalance}>
            <Flex align="baseline" gap={4}>
              <Flex align="baseline">
                <Text
                  size="5xl"
                  weight="medium"
                  noMargin
                  style={{ cursor: "pointer" }}
                  onClick={() => setHideBalance((val) => !val)}>
                  <NumberFlow value={agentBalance} />
                </Text>
                <Text size="base" weight="medium" noMargin>
                  {ticker}
                </Text>
              </Flex>
              <SvgImageWithBackground
                height={14}
                width={14}
                shape="circle"
                src={`${gatewayUrl}/${token.icon}`}
                iconSize={14}
              />
            </Flex>
            <Text size="sm" variant="secondary" weight="medium" noMargin>
              <NumberFlow
                value={fiatBalance}
                format={{
                  style: "currency",
                  currency: currency,
                }}
              />
            </Text>
          </Balances>
        </Flex>

        <Spacer y={1.1} />

        <Flex align="center" gap={10}>
          <Button variant="primary" fullWidth onClick={() => navigate(`/agents/liquidops/${ticker}/deposit`)}>
            {browser.i18n.getMessage("deposit")}
          </Button>
          <Button variant="secondary" fullWidth onClick={() => navigate(`/agents/liquidops/${ticker}/withdraw`)}>
            {browser.i18n.getMessage("withdraw")}
          </Button>
        </Flex>

        <Spacer y={1.1} />

        <Stats>
          <Text size="sm" variant="secondary" weight="medium" noMargin style={{ textAlign: "center" }}>
            {browser.i18n.getMessage("apy_earned")}
          </Text>
          <Spacer y={0.5} />
          <Grid>
            <Flex direction="column" align="center" gap=".2rem" padding="2px 0">
              <Text size="lg" weight="medium" noMargin>
                {supplyAPR}%
              </Text>
              <Text size="xs" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("current_apy")}
              </Text>
            </Flex>
            <VerticalLine />
            <Flex direction="column" align="center" gap=".2rem" padding="2px 0">
              <Text size="lg" weight="medium" noMargin style={{ color: "rgb(86, 201, 128)" }}>
                +{earnedInterest} {ticker}
              </Text>
              <Text size="xs" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("earned")}
              </Text>
            </Flex>
          </Grid>
        </Stats>

        <Spacer y={1.1} />

        <Flex direction="column" gap=".35rem">
          <Flex align="center" gap=".55rem">
            <Text size="md" weight="medium" noMargin>
              {browser.i18n.getMessage("status")}
            </Text>
            <StatusLabel status={true} label={browser.i18n.getMessage("active")} />
          </Flex>

          <Spacer y={0.4} />

          <Flex direction="column" gap=".4rem">
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("start_date")}
              </Text>
              <Text size="sm" weight="medium" noMargin>
                {dayjs(Date.now()).format("MMM DD, YYYY")}
              </Text>
            </Flex>
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("token_balance", ["o" + ticker])}
              </Text>
              <Flex align="center" gap={4}>
                <Text size="sm" weight="medium" noMargin>
                  {oTokenBalance.toString()} {"o" + ticker}
                </Text>
                <SvgImageWithBackground
                  height={16}
                  width={16}
                  shape="circle"
                  src={"https://arweave.net/7EEISJIzxC-3RPhgvRc-lAZnP7st1b79_ER4Sc5P_MU"} /** TODO: oToken logo */
                  iconSize={16}
                />
              </Flex>
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
              {browser.i18n.getMessage("liquidops_open")}
              <LinkExternalIcon />
            </OpenInLiquidops>
          </Flex>
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  padding-top: 0px;
  --number-flow-char-height: 0.84em;
`;

const Stats = styled.div`
  border-radius: 10px;
  padding: 12px 16px 16px;
  border: 1px solid ${(props) => props.theme.borderDefault};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  padding: 6px 1fr;
`;

const VerticalLine = styled.div`
  width: 1px;
  height: 100%;
  background-color: ${(props) => props.theme.borderDefault};
`;

const Balances = styled(Flex)<{ blur: boolean }>`
  filter: ${(props) => (props.blur ? "blur(8px)" : "blur(0px)")};
  user-select: ${(props) => (props.blur ? "none" : "auto")};
  transition: filter linear 300ms;
`;
