import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../SvgImage";
import AoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { tokenData } from "liquidops";
import { useLOSupplyAPY } from "../../liquidops/utils/hooks/useLOSupplyAPY";
import { useLOOTokenBalance } from "../../liquidops/utils/hooks/useLOOTokenBalance";
import { useMemo } from "react";

export const Agent = ({ ticker, logo, running = false }: Props) => {
  const { navigate } = useLocation();

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const token = useMemo(
    () => activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [ticker, activeTokens],
  );

  // Always call hooks unconditionally at the top level
  const { data: walletBalance } = useLOOTokenBalance(token.cleanTicker);
  const { data: supplyAPY } = useLOSupplyAPY(token.ticker);

  // Early return if token not found
  if (!token) {
    return <></>;
  }

  return (
    <ListItem
      title={
        <Flex justify="space-between" align="center" width="100%">
          <Text weight="semibold" noMargin>
            {ticker}
          </Text>
          <Text weight="semibold" noMargin style={running ? { color: "rgb(86, 201, 128)" } : {}}>
            {running ? "+" : ""}
            {(supplyAPY || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {running ? " " + ticker : "%"}
          </Text>
        </Flex>
      }
      subtitle={
        <Flex justify="space-between" align="center" width="100%">
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {((running ? supplyAPY : walletBalance) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {running ? "% APY" : " " + ticker}
          </Text>
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {browser.i18n.getMessage(running ? "earned" : "estimated_apy")}
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
          hasBorder={ticker.toUpperCase() === "AO"}
          iconColor={ticker.toUpperCase() === "AO" ? "black" : undefined}
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
      onClick={() => navigate(`/agents/liquidops/${ticker}`)}
    />
  );
};

type Props = {
  ticker: string;
  logo?: string;
  running?: boolean;
};
