import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../SvgImage";
import AoLogo from "url:/assets/ecosystem/ao-logo.svg";
import type { Quantity } from "ao-tokens";

export const Agent = ({ ticker, walletBalance, logo, supplyAPY, running = false }: Props) => (
  <ListItem
    title={
      <Flex justify="space-between" align="center" width="100%">
        <Text weight="semibold" noMargin>
          {ticker}
        </Text>
        <Text weight="semibold" noMargin>
          {supplyAPY.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
        </Text>
      </Flex>
    }
    subtitle={
      <Flex justify="space-between" align="center" width="100%">
        <Text size="sm" variant="secondary" weight="medium" noMargin>
          {walletBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {ticker}
        </Text>
        <Text size="sm" variant="secondary" weight="medium" noMargin>
          Estimated APY
        </Text>
      </Flex>
    }
    squircleSize={40}
    hideSquircle={true}
    icon={
      <SvgImageWithBackground
        height={44}
        width={40}
        shape="hexagon"
        src={logo || AoLogo}
        iconSize={24}
        iconColor="black"
        hasBorder
      />
    }
    active
    style={{ width: "100%", textAlign: "left", padding: "12px 8px" }}
  />
);

interface Props {
  ticker: string;
  walletBalance: Quantity;
  logo?: string;
  supplyAPY: number;
  running?: boolean;
}
