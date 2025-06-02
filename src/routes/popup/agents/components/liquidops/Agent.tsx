import { ListItem, Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import { SvgImageWithBackground } from "../SvgImage";
import AoLogo from "url:/assets/ecosystem/ao-logo.svg";
import { Quantity } from "ao-tokens";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { useTokenBalance } from "~tokens/hooks";
import { tokenData } from "liquidops";
import { useLiquidOpsSupplyAPY } from "../../liquidops/utils/useLiquidOpsSupplyAPY";

export const Agent = ({ ticker, logo, running = false, earned = new Quantity(0n, 0n) }: Props) => {
  const { navigate } = useLocation();

  const activeTokens = Object.values(tokenData).filter((token) => !token.deprecated);

  const token = activeTokens.find((token) => token.ticker.toLowerCase() === ticker.toLowerCase());

  const tokenObj = {
    Name: token.name,
    Denomination: Number(token.denomination),
    processId: token.oAddress,
  };
  const walletBalance = useTokenBalance(tokenObj, token.oAddress); // TODO: get oToken rate

  const supplyAPY = useLiquidOpsSupplyAPY(token.ticker);

  return (
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
  earned?: Quantity;
};
