import { ListItem, Text } from "@wanderapp/components";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../SvgImage";
import AoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { tokenData } from "liquidops";
import { useLOSupplyAPY } from "../../liquidops/utils/hooks/useLOSupplyAPY";
import { useMemo } from "react";
import { useTokenBalance } from "~tokens/hooks";
import type { TokenInfo } from "~tokens/aoTokens/ao";
import { ExtensionStorage } from "~utils/storage";
import { useStorage } from "@plasmohq/storage/hook";
import BigNumber from "bignumber.js";
import { useGateway } from "../../liquidops/utils/hooks/useGateway";
import { formatNumber } from "../../liquidops/utils/format";
import { useTheme } from "~utils/theme/theme.hook";

export const Agent = ({ ticker, running = false, profit = BigNumber(0) }: Props) => {
  const { navigate } = useLocation();

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);
  const token = useMemo(
    () => activeTokens && ticker && activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase()),
    [ticker, activeTokens],
  );

  const tokenInfo = useMemo<TokenInfo>(
    () => ({
      Name: token.name,
      Ticker: token.cleanTicker,
      Denomination: Number(token.denomination),
      processId: token.address,
    }),
    [token],
  );
  const { data: logo } = useGateway(token.icon);

  const { displayTheme } = useTheme();

  // current wallet
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  // Always call hooks unconditionally at the top level
  const { data: supplyAPY = 0 } = useLOSupplyAPY(token.ticker);
  const { data: balance = "0" } = useTokenBalance(tokenInfo, activeAddress);

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
            {formatNumber(running ? profit : supplyAPY, 2, running ? 6 : 0)}
            {running ? " " + ticker : "%"}
          </Text>
        </Flex>
      }
      subtitle={
        <Flex justify="space-between" align="center" width="100%">
          <Text size="sm" variant="secondary" weight="medium" noMargin>
            {formatNumber(running ? supplyAPY : BigNumber(balance), 2, running ? 0 : 6)}
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
        padding: "8px",
        ...(running
          ? {
              backgroundColor: `rgba(${displayTheme === "dark" ? "37, 51, 39" : "233, 252, 236"}, 0.5)`,
              border: `1px solid rgb(${displayTheme === "dark" ? "16, 65, 36" : "4, 170, 62"})`,
            }
          : {}),
      }}
      onClick={() => navigate(`/agents/liquidops/${ticker}${running ? "" : "/deposit"}`)}
    />
  );
};

type Props = {
  ticker: string;
  running?: boolean;
  profit?: BigNumber;
};
