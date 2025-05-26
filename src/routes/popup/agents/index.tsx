import styled from "styled-components";
import { ListItem, Section, Text } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import HedgehogHeadIcon from "url:/assets/agents/hedgehog-head.svg";
import { Flex } from "~components/common/Flex";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import LiquidOpsIcon from "url:/assets/ecosystem/liquidops.svg";
import UsdaIcon from "url:/assets/ecosystem/usda.svg";
import WarIcon from "url:/assets/ecosystem/war.svg";
import { ClockRewind } from "@untitled-ui/icons-react";

export function AgentsView() {
  return (
    <>
      <HeadV2 title={browser.i18n.getMessage("agents")} backIcon={<ClockRewind fontSize={24} />} back={() => {}} />

      <Wrapper>
        <Flex align="center" gap={16} justify="center" direction="column" textAlign="center">
          <img src={HedgehogHeadIcon} alt="Hedgehog Head" height={128} width={120} />
          <Text size="md" weight="medium" noMargin>
            You don't have any active yield agents
          </Text>
          <ListItem
            title={"AO Yield Agent"}
            subtitle={"Automatically convert your AO to wUSDC ot wAR"}
            subtitleStyle={{ fontSize: 10, fontWeight: 500 }}
            squircleSize={40}
            hideSquircle={true}
            icon={
              <LogoBackground>
                <Image src={aoLogo} size={28} />
              </LogoBackground>
            }
            active
            style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
          />
          <ListItem
            title={"LiquidOps Agent"}
            subtitle={"0 agents active, 3 agents available"}
            subtitleStyle={{ fontSize: 14, fontWeight: 500 }}
            squircleSize={40}
            hideSquircle={true}
            icon={
              <Flex borderRadius="50%" align="center" justify="center" height={40} width={40} overflow="hidden">
                <img src={LiquidOpsIcon} alt="LiquidOps" style={{ transform: "scale(1.3)" }} />
              </Flex>
            }
            active
            style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
            expandable
            expandableContent={
              <Flex direction="column" gap={16}>
                <ListItem
                  title={<Title ticker="AO" apy="1.13" />}
                  icon={
                    <LogoBackground size={24}>
                      <Image src={aoLogo} size={16} />
                    </LogoBackground>
                  }
                  hideSquircle
                  padding={0}
                  subtitleExtra={<Status status="Inactive" />}
                />
                <ListItem
                  title={<Title ticker="USDA" apy="3.43" />}
                  icon={<img src={UsdaIcon} height={24} width={24} />}
                  hideSquircle
                  padding={0}
                  subtitleExtra={<Status status="Inactive" />}
                />
                <ListItem
                  title={<Title ticker="wAR" apy="1.57" />}
                  icon={<img src={WarIcon} height={24} width={24} />}
                  hideSquircle
                  padding={0}
                  subtitleExtra={<Status status="Inactive" />}
                />
              </Flex>
            }
          />
        </Flex>
      </Wrapper>
    </>
  );
}

const Wrapper = styled(Section)`
  height: 100%;
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
  overflow-y: auto;
  padding-bottom: 100px;
`;

const Image = styled.div<{ src: string; size: number; color?: string }>`
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  background-color: ${(props) => props.color || "black"};
  -webkit-mask: url(${(props) => props.src}) no-repeat center;
  mask: url(${(props) => props.src}) no-repeat center;
  -webkit-mask-size: contain;
  mask-size: contain;
`;

const LogoBackground = ({ children, size = 40 }: { children: React.ReactNode; size?: number }) => {
  return (
    <Flex
      borderRadius={50}
      align="center"
      justify="center"
      height={size}
      width={size}
      overflow="hidden"
      background="white">
      {children}
    </Flex>
  );
};

const Title = ({ ticker, apy }: { ticker: string; apy: string }) => (
  <Flex direction="row" gap={4} align="center">
    <Text size="md" weight="semibold" noMargin>
      {ticker}
    </Text>
    <Text variant="secondary" size="sm" weight="medium" noMargin>
      {apy}% APY
    </Text>
  </Flex>
);

const Status = ({ status }: { status: string }) => (
  <Text variant="tertiary" weight="medium" noMargin>
    {status}
  </Text>
);
