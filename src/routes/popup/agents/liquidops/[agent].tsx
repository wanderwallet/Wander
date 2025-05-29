import HeadV2 from "~components/popup/HeadV2";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { Button, Section, Text } from "@arconnect/components-rebrand";
import styled from "styled-components";
import UsdaLogo from "url:/assets/ecosystem/usda.svg";
import Image from "~components/common/Image";
import { SvgImageWithBackground } from "../components/SvgImage";
import { Spacer } from "~components/embed";

export function LiquidOpsAgent() {
  return (
    <>
      <HeadV2 title={"USDA " + browser.i18n.getMessage("agent")} />

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
                  USDA
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
        </Stats>
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
