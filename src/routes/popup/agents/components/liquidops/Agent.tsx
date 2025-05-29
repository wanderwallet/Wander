import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../SvgImage";
import AoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { Quantity } from "ao-tokens";

export const Agent = ({
  ticker,
  walletBalance,
  logo,
  supplyAPY,
  running = false,
  earned = new Quantity(0n, 0n),
}: Props) => (
  <ListItem
    title={
      <Flex justify="space-between" align="center" width="100%">
        <Text weight="semibold" noMargin>
          {ticker}
        </Text>
        <Text weight="semibold" noMargin style={running ? { color: "rgb(86, 201, 128)" } : {}}>
          {running ? "+" : ""}
          {(running ? earned : supplyAPY).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          {running ? " " + ticker : "%"}
        </Text>
      </Flex>
    }
    subtitle={
      <Flex justify="space-between" align="center" width="100%">
        <Text size="sm" variant="secondary" weight="medium" noMargin>
          {(running ? supplyAPY : walletBalance).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          {running ? "% APY" : " " + ticker}
        </Text>
        <Text size="sm" variant="secondary" weight="medium" noMargin>
          {running ? "Earned" : "Estimated APY"}
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
    style={{
      width: "100%",
      textAlign: "left",
      padding: "12px 8px",
      ...(running
        ? {
            backgroundColor: "rgba(37, 51, 39, 0.5)",
            border: "1px solid rgb(16, 65, 36)",
          }
        : {}),
    }}
  />
);

type Props = {
  ticker: string;
  walletBalance: Quantity;
  logo?: string;
  supplyAPY: number;
  running?: boolean;
  earned?: Quantity;
};
