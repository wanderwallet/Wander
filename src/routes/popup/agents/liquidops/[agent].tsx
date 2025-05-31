import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { Button, Section, Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import UsdaLogo from "url:/assets/ecosystem/usda.svg";
import { SvgImageWithBackground } from "../components/SvgImage";
import { Spacer } from "~components/embed";
import dayjs from "dayjs";
import { LinkExternal02 } from "@untitled-ui/icons-react";
import { StatusLabel } from "../components/StatusLabel";
import type { CommonRouteProps } from "~wallets/router/router.types";

export type LiquidOpsAgentProps = CommonRouteProps<{ ticker: string }>;

export function LiquidOpsAgent({ params: { ticker } }: LiquidOpsAgentProps) {
  return (
    <>
      <HeadV2 title={ticker + " " + browser.i18n.getMessage("agent")} />

      <Wrapper>
        <Flex align="center" direction="column" gap={2}>
          <Text size="base" variant="secondary" weight="medium" noMargin>
            {browser.i18n.getMessage("deposited")}
          </Text>
          <Flex align="center" direction="column" gap={4}>
            <Flex align="baseline" gap={4}>
              <Flex align="baseline">
                <Text size="5xl" weight="medium" noMargin>
                  10
                </Text>
                <Text size="base" weight="medium" noMargin>
                  {ticker}
                </Text>
              </Flex>
              <SvgImageWithBackground height={14} width={14} shape="circle" src={UsdaLogo} iconSize={14} />
            </Flex>
            <Text size="sm" variant="secondary" weight="medium" noMargin>
              $10.00 USD
            </Text>
          </Flex>
        </Flex>
        <Spacer y={1.1} />
        <Flex align="center" gap={10}>
          <Button variant="primary" fullWidth>
            {browser.i18n.getMessage("deposit")}
          </Button>
          <Button variant="secondary" fullWidth>
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
                3.43%
              </Text>
              <Text size="xs" variant="secondary" weight="medium" noMargin>
                {browser.i18n.getMessage("current_apy")}
              </Text>
            </Flex>
            <VerticalLine />
            <Flex direction="column" align="center" gap=".2rem" padding="2px 0">
              <Text size="lg" weight="medium" noMargin style={{ color: "rgb(86, 201, 128)" }}>
                +0.85 {ticker}
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
                  10 {"o" + ticker}
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
                  url: `https://liquidops.io/${ticker}`, // TODO this should be the ticker of the token
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

const OpenInLiquidops = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.3rem;
  color: ${(props) => props.theme.primary};
  cursor: pointer;
`;

const LinkExternalIcon = styled(LinkExternal02)`
  height: 1em;
  width: 1em;
  color: ${(props) => props.theme.secondaryText};
`;
