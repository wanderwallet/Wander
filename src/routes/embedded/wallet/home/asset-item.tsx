import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState } from "react";
import { Row, Text, Box } from "~components/embed/ui";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import { useTokenBalance } from "~tokens/hooks";
import { formatBalance } from "~utils/format";
import { ExtensionStorage, useStorage } from "~utils/storage";
import arLogoLight from "../../../../../assets/ar/logo_light.png";
import arLogoDark from "../../../../../assets/ar/logo_dark.png";
import { useTheme } from "~utils/theme";
import { Logo } from "~components/popup/Token";
import { getArweaveLink } from "~gateways/utils";

interface AssetItemProps {
  id: string;
  defaultLogo: string;
  tokenName: string;
  ticker: string;
  amount: string;
  fiatPrice: number;
  divisibility: number;
}

export function AssetItem({
  id,
  defaultLogo,
  tokenName,
  ticker,
  amount,
  fiatPrice,
  divisibility
}: AssetItemProps) {
  const theme = useTheme();
  const [logo, setLogo] = useState<string>();
  const [totalBalance, setTotalBalance] = useState("");

  const [currency] = useSetting("currency");
  const [activeAddress] = useStorage({
    key: "active_address",
    instance: ExtensionStorage
  });

  const tokenInfo = useMemo(() => {
    return {
      id,
      processId: id,
      Ticker: ticker,
      Name: tokenName,
      Denomination: divisibility,
      Logo: defaultLogo
    };
  }, [id, ticker, tokenName, divisibility, defaultLogo]);

  const {
    data: fractBalance = "0",
    isError,
    error,
    isLoading
  } = useTokenBalance(tokenInfo, activeAddress);

  const arweaveLogo = useMemo(
    () => (theme === "dark" ? arLogoDark : arLogoLight),
    [theme]
  );

  const balance = useMemo(() => {
    if (isError) return "0";
    const formattedBalance = formatBalance(BigNumber(fractBalance));
    setTotalBalance(formattedBalance.tooltipBalance);
    return formattedBalance.displayBalance;
  }, [fractBalance, isError]);

  const formattedFiatPrice = useMemo(() => {
    if (!fiatPrice) return undefined;
    return formatFiatBalance(fiatPrice, currency);
  }, [fiatPrice, currency]);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!id || logo) return;
      if (defaultLogo) {
        const logo = await getArweaveLink(defaultLogo);
        setLogo(logo);
      } else {
        setLogo(arweaveLogo);
      }
    };

    fetchLogo();
  }, [id, defaultLogo, arweaveLogo, logo]);

  return (
    <Row
      alignment="center"
      justifyContent="between"
      style={{
        cursor: "pointer",
        height: "62px"
      }}
    >
      <Logo src={logo || ""} alt="" key={`logo-${id}`} />
      <Text variant="bodyMd" style={{ color: "#121212", minWidth: "100px" }}>
        {tokenName}
      </Text>
      <Box alignment="right">
        <Text alignment="right" variant="bodyMd" style={{ color: "#121212" }}>
          {balance + " " + ticker}
        </Text>
        <Text alignment="right" variant="bodySm" style={{ color: "#666666" }}>
          {formattedFiatPrice}
        </Text>
      </Box>
    </Row>
  );
}
