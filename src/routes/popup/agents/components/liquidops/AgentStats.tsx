import { Text } from "@wanderapp/components";
import browser from "webextension-polyfill";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../SvgImage";
import LiquidOpsLogo from "url:/assets/ecosystem/liquidops.svg";
import styled from "styled-components";
import { LinkExternal02 } from "@untitled-ui/icons-react";

export const AgentStats = ({ ticker, apy, size, wanderFee, transactionFee }: Props) => (
  <Flex direction="column" gap=".5rem">
    {apy && (
      <Flex justify="space-between" style={{ width: "100%" }}>
        <Text size="sm" variant="secondary" weight="medium" noMargin>
          {browser.i18n.getMessage("estimated_apy")}
        </Text>
        <Text size="sm" weight="medium" noMargin>
          {apy}%
        </Text>
      </Flex>
    )}
    <Flex justify="space-between" style={{ width: "100%" }}>
      <Text size="sm" variant="secondary" weight="medium" noMargin>
        {browser.i18n.getMessage("transaction_fee")}
      </Text>
      <Text size="sm" weight="medium" noMargin>
        {transactionFee.toLocaleString(undefined, { maximumFractionDigits: 8 })}
      </Text>
    </Flex>
    <Flex justify="space-between" style={{ width: "100%" }}>
      <Text size="sm" variant="secondary" weight="medium" noMargin>
        {browser.i18n.getMessage("wander_fee")}
      </Text>
      <Text size="sm" weight="medium" noMargin>
        {wanderFee.toLocaleString(undefined, { maximumFractionDigits: 8 })}
      </Text>
    </Flex>
    <Flex justify="space-between" style={{ width: "100%" }}>
      <Text size="sm" variant="secondary" weight="medium" noMargin>
        {browser.i18n.getMessage("transaction_size")}
      </Text>
      <Text size="sm" weight="medium" noMargin>
        {size.toLocaleString()}
        {" B"}
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
);

interface Props {
  ticker: string;
  apy?: string;
  size: number;
  wanderFee: number;
  transactionFee: number;
}

export const OpenInLiquidops = styled(Text)`
  display: flex;
  align-items: center;
  gap: 0.24rem;
  color: ${(props) => props.theme.primary};
  cursor: pointer;
`;

export const LinkExternalIcon = styled(LinkExternal02)`
  height: 1em;
  width: 1em;
  color: ${(props) => props.theme.secondaryText};
`;
