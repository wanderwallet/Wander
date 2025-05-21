import BigNumber from "bignumber.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Row, Text, Box, Button } from "~components/embed/ui";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import { useTokenBalance } from "~tokens/hooks";
import { formatBalance } from "~utils/format";
import { ExtensionStorage, useStorage } from "~utils/storage";
import arLogoLight from "../../../../../../assets/ar/logo_light.png";
import arLogoDark from "../../../../../../assets/ar/logo_dark.png";
import { useTheme } from "~utils/theme";
import { Logo } from "~components/popup/Token";
import { getArweaveLink } from "~gateways/utils";

import styles from "./asset-item.module.scss";

interface AssetItemProps {
  activeWalletAddress: string;
  id: string;
  defaultLogo: string;
  tokenName: string;
  ticker: string;
  amount: string;
  fiatPrice: number;
  divisibility: number;
}

export function AssetItem({ activeWalletAddress, id, defaultLogo, tokenName, ticker, amount, fiatPrice, divisibility }: AssetItemProps) {
  const theme = useTheme();
  const [logo, setLogo] = useState<string>();
  const [totalBalance, setTotalBalance] = useState("");

  const [currency] = useSetting("currency");
  const [activeAddress] = useStorage({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const tokenInfo = useMemo(() => {
    return {
      id,
      processId: id,
      Ticker: ticker,
      Name: tokenName,
      Denomination: divisibility,
      Logo: defaultLogo,
    };
  }, [id, ticker, tokenName, divisibility, defaultLogo]);

  const { data: fractBalance = "0", isError, error, isLoading } = useTokenBalance(tokenInfo, activeAddress);

  const arweaveLogo = useMemo(() => (theme === "dark" ? arLogoDark : arLogoLight), [theme]);

  const balance = useMemo(() => {
    if (isError) return "0";
    const formattedBalance = formatBalance(BigNumber(fractBalance));
    setTotalBalance(formattedBalance.tooltipBalance);
    return formattedBalance.displayBalance;
  }, [fractBalance, isError]);

  console.log(`amount = ${ amount }, balance = ${ balance }`)

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

  const infoRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const balanceAndPriceRef = useRef<HTMLDivElement>(null);
  const balanceRef = useRef<HTMLSpanElement>(null);
  const tickerRef = useRef<HTMLSpanElement>(null);

  const [balanceOffset, setBalanceOffset] = useState(undefined);
  const [balanceMaxWidth, setBalanceMaxWidth] = useState(undefined);
  const [nameMarqueeOffset, setNameMarqueeOffset] = useState(undefined);
  const [balanceMarqueeOffset, setBalanceMarqueeOffset] = useState(undefined);

  const handleExpandName = () => {
    const nameElement = nameRef.current;
    const infoElement = infoRef.current;
    const balanceAndPriceElement = balanceAndPriceRef.current;

    if (!nameElement || !infoElement || !balanceAndPriceElement) return;

    const nameWidth = nameElement.offsetWidth;
    const totalWidth = infoElement.offsetWidth;
    const visibleWidth = totalWidth - balanceAndPriceElement.offsetWidth - 16;

    if (nameWidth <= visibleWidth) return;

    // TODO: Set max
    const extraWidthNeeded = Math.min(nameWidth - visibleWidth, totalWidth / 2 + 16);

    setBalanceOffset(extraWidthNeeded);

    if (nameWidth > totalWidth) {
      const nameMarqueeOffset = nameWidth - totalWidth;

      setNameMarqueeOffset(nameMarqueeOffset);
    }
  };

  const handleExpandBalance = () => {
    const balanceElement = balanceRef.current;
    const infoElement = infoRef.current;
    const tickerElement = tickerRef.current;

    if (!balanceElement || !infoElement || !tickerElement) return;

    const tickerWidth = tickerElement.offsetWidth;
    const balanceWidth = balanceElement.offsetWidth;
    const totalWidth = infoElement.offsetWidth - tickerWidth;
    const visibleWidth = totalWidth / 2 - 16 - tickerWidth;

    if (balanceWidth <= visibleWidth) return;

    setBalanceMaxWidth(infoElement.offsetWidth + 16);

    if (balanceWidth > totalWidth) {
      const balanceMarqueeOffset = balanceWidth - totalWidth;

      setBalanceMarqueeOffset(balanceMarqueeOffset);
    }
  }

  const handleCollapse = () => {
    setBalanceOffset(undefined);
    setBalanceMaxWidth(undefined)

    setNameMarqueeOffset(undefined);
    setBalanceMarqueeOffset(undefined)
  };

  // const href = id === "AO"
  //   ? `https://viewblock.io/arweave/address/${ activeWalletAddress }` as const
  //   : `https://www.ao.link/#/token/${id}` as const;

  let b = balance;

  b = "10.000000000000001";

  const style: React.CSSProperties = {} as any;

  if (balanceOffset !== undefined) style["--balanceOffset"] = `${ balanceOffset }px`;
  if (balanceMaxWidth !== undefined) style["--balanceMaxWidth"] = `${ balanceMaxWidth }px`;

  const nameStyle: React.CSSProperties = {} as any;

  if (nameMarqueeOffset) {
    nameStyle.animation = `${ nameMarqueeOffset / 10 }s linear infinite alternate ${ styles.marqueeAnimation }`;
    nameStyle["--marqueeOffset"] = `${ -nameMarqueeOffset }px`;
  }

  const balanceStyle: React.CSSProperties = {} as any;

  if (balanceMarqueeOffset) {
    balanceStyle.animation = `${ balanceMarqueeOffset / 10 }s linear infinite alternate ${ styles.marqueeAnimation }`;
    balanceStyle["--marqueeOffset"] = `${ -balanceMarqueeOffset }px`;
  }

  return (
    <div className={ styles.root }>
      <Logo
        className={ styles.logo }
        key={`logo-${id}`}
        src={logo || ""}
        alt="" />

      <div className={ styles.info } ref={ infoRef }>
        <Text variant="bodyMd" style={{ color: "#121212", ...nameStyle }} className={ styles.name } ref={ nameRef } onMouseEnter={ handleExpandName } onMouseLeave={ handleCollapse }>
          {tokenName}{tokenName}
        </Text>

        <div className={ styles.balanceAndPrice } style={style} ref={ balanceAndPriceRef }>
          <Text alignment="right" variant="bodyMd" style={{ color: "#121212" }} className={ styles.balance }>
            <span className={ styles.balanceAmountWrapper }>
              <span className={ styles.balanceAmount } ref={ balanceRef } style={ balanceStyle } onMouseEnter={ handleExpandBalance } onMouseLeave={ handleCollapse }>{ b }</span>
            </span>
            <span className={ styles.balanceTicker } ref={ tickerRef }>{ ticker }</span>
          </Text>
          <Text alignment="right" variant="bodySm" style={{ color: "#666666" }} className={ styles.fiat }>
            {formattedFiatPrice || "N/A"}
          </Text>
        </div>
      </div>
    </div>
  );
}
