import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { Button, Section, Text, Loading } from "@wanderapp/components";
import styled from "styled-components";
import { SvgImageWithBackground } from "../components/SvgImage";
import { Spacer } from "~components/embed";
import dayjs from "dayjs";
import { StatusLabel } from "../components/StatusLabel";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { LinkExternalIcon, OpenInLiquidops } from "../components/liquidops/AgentStats";
import NumberFlow from "@number-flow/react";
import { useEffect, useMemo } from "react";
import useSetting from "~settings/hook";
import { useStorage } from "~utils/storage";
import { PersistentStorage } from "~utils/storage";
import { tokenData } from "liquidops";
import { useLOSupplyAPY } from "./utils/hooks/useLOSupplyAPY";
import { useLOOTokenBalance } from "./utils/hooks/useLOOTokenBalance";
import { useEarnings } from "./utils/hooks/useEarnings";
import { useGateway } from "./utils/hooks/useGateway";
import { useTokenStatus } from "./utils/hooks/useTokenStatus";
import { useLOAssetBalance } from "./utils/hooks/useLOAssetBalance";
import { useTokenBalance, useTokenPrice } from "~tokens/hooks";
import BigNumber from "bignumber.js";
import { formatNumber } from "./utils/format";
import { PageType, trackPage } from "~utils/analytics";
import { type TokenInfo } from "~tokens/aoTokens/ao";
import { useActiveWallet } from "~wallets/hooks";

export type LiquidOpsAgentProps = CommonRouteProps<{ ticker: string }>;

export function LiquidOpsAgent({ params: { ticker } }: LiquidOpsAgentProps) {
  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [activeTokens, ticker],
  );
  const oToken = useMemo<TokenInfo>(
    () => ({
      processId: token.oAddress,
      Denomination: Number(token.denomination),
    }),
    [token],
  );

  const wallet = useActiveWallet();

  // Always call hooks unconditionally at the top level
  const { data: oTokenBalance = "0" } = useTokenBalance(oToken, wallet?.address);
  const { data: agentBalance = BigNumber(0), isLoading: isLoadingAgentBalance } = useLOAssetBalance(token.cleanTicker);

  const maximumFractionDigits = useMemo(() => {
    if (!agentBalance) return 2;
    return agentBalance.isLessThan(10) ? 6 : 2;
  }, [agentBalance]);

  const { data: supplyAPR = 0 } = useLOSupplyAPY(token.ticker);
  const { data: earned = { profit: BigNumber(0), startDate: undefined } } = useEarnings(token.ticker);
  const { data: tokenIconUrl } = useGateway(token.icon);

  const { hasToken: tokenStatus } = useTokenStatus(token.ticker);

  // router
  const { navigate, previousLocation } = useLocation();

  // balance in local currency
  const [currency] = useSetting<string>("currency");
  const { price = 0 } = useTokenPrice(token.address, currency || "USD");
  const fiatBalance = useMemo(() => (agentBalance ? agentBalance.multipliedBy(price) : 0), [price, agentBalance]);

  // balance display
  const [hideBalance, setHideBalance] = useStorage<boolean>(
    {
      key: "hide_balance",
      instance: PersistentStorage,
    },
    false,
  );

  useEffect(() => {
    trackPage(PageType.LIQUID_OPS_AGENT_MANAGE);
  }, []);

  // Handle case where token is not found
  if (!token) {
    return (
      <>
        <HeadV2 title={ticker + " " + browser.i18n.getMessage("agent")} />
        <Wrapper>
          <Flex align="center" justify="center" direction="column" gap={16}>
            <Text size="lg" weight="medium" noMargin>
              Token not found
            </Text>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </Flex>
        </Wrapper>
      </>
    );
  }

  return (
    <>
      <HeadV2
        title={ticker + " " + browser.i18n.getMessage("agent")}
        back={() => {
          if (previousLocation === "/agents") {
            navigate(previousLocation);
          } else {
            navigate("/agents/liquidops/agents");
          }
        }}
      />

      <Wrapper>
        <Flex align="center" direction="column" gap={2}>
          <Text size="base" variant="secondary" weight="medium" noMargin>
            {browser.i18n.getMessage("deposited")}
          </Text>
          <div style={{ position: "relative" }}>
            {isLoadingAgentBalance ? (
              <Loading
                style={{
                  position: "absolute",
                  top: "calc(50% - 10px)",
                  left: "calc(50% - 10px)",
                  width: "20px",
                  height: "20px",
                }}
              />
            ) : null}
            <Balances align="center" direction="column" gap={4} blur={hideBalance || isLoadingAgentBalance}>
              <Flex align="baseline" gap={4}>
                <Flex align="baseline">
                  <Text
                    size="5xl"
                    weight="medium"
                    noMargin
                    style={{ cursor: "pointer" }}
                    onClick={() => setHideBalance((val) => !val)}>
                    <NumberFlow value={agentBalance} format={{ maximumFractionDigits }} />
                  </Text>
                  <Text size="base" weight="medium" noMargin>
                    {ticker}
                  </Text>
                </Flex>
                <SvgImageWithBackground height={14} width={14} shape="circle" src={tokenIconUrl} iconSize={14} />
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
          </div>
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
                <NumberFlow
                  value={supplyAPR / 100}
                  format={{
                    style: "percent",
                    maximumFractionDigits: 2,
                    minimumFractionDigits: 2,
                  }}
                />
              </Text>
              <Text size="xs" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("current_apy")}
              </Text>
            </Flex>
            <VerticalLine />
            <Flex direction="column" align="center" gap=".2rem" padding="2px 0">
              <Text size="lg" weight="medium" noMargin style={{ color: "rgb(86, 201, 128)" }}>
                <NumberFlow
                  value={earned.profit}
                  format={{ maximumFractionDigits: 2 }}
                  prefix="+"
                  suffix={" " + ticker}
                />
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
            <StatusLabel status={tokenStatus} label={browser.i18n.getMessage(tokenStatus ? "active" : "inactive")} />
          </Flex>

          <Spacer y={0.4} />

          <Flex direction="column" gap=".4rem">
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("start_date")}
              </Text>
              <Text size="sm" weight="medium" noMargin>
                {earned.startDate ? dayjs(earned.startDate * 1000).format("MMM DD, YYYY") : "--"}
              </Text>
            </Flex>
            <Flex justify="space-between" style={{ width: "100%" }}>
              <Text size="sm" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("token_balance", ["o" + ticker])}
              </Text>
              <Flex align="center" gap={4}>
                <Text size="sm" weight="medium" noMargin>
                  {oTokenBalance} {"o" + ticker}
                </Text>
                <SvgImageWithBackground
                  height={16}
                  width={16}
                  shape="circle"
                  src={useGateway(token.oIcon).data}
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
  position: relative;
  filter: ${(props) => (props.blur ? "blur(8px)" : "blur(0px)")};
  user-select: ${(props) => (props.blur ? "none" : "auto")};
  transition: filter linear 300ms;
`;
