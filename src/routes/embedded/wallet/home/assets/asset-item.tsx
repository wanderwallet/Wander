import BigNumber from "bignumber.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Text } from "~components/embed/ui";
import useSetting from "~settings/hook";
import { formatFiatBalance } from "~tokens/currency";
import { useTokenBalance } from "~tokens/hooks";
import { formatBalance } from "~utils/format";
import { ExtensionStorage, useStorage } from "~utils/storage";
import { TokenLogo } from "~components/popup/TokenLogo";
import clsx from "clsx";
import { useThrottledCallback } from "@swyg/corre";

import styles from "./asset-item.module.scss";

interface AssetItemProps {
  id: string;
  defaultLogo: string;
  tokenName: string;
  ticker: string;
  amount: string;
  fiatPrice: number;
  divisibility: number;
}

export function AssetItem({ id, defaultLogo, tokenName, ticker, amount, fiatPrice, divisibility }: AssetItemProps) {
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

  const infoRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
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

  const [ellipseBalance, setEllipseBalance] = useState(false);

  const getEllipseBalance = useCallback(() => {
    const balanceElement = balanceRef.current;
    const infoElement = infoRef.current;
    const tickerElement = tickerRef.current;

    if (!balanceElement || !infoElement || !tickerElement) return false;

    const tickerWidth = tickerElement.offsetWidth;
    const balanceWidth = balanceElement.offsetWidth;
    const totalWidth = infoElement.offsetWidth - tickerWidth;
    const visibleWidth = totalWidth / 2 - 16 - tickerWidth;

    return balanceWidth > visibleWidth;
  }, []);

  const getRealBalanceMaxWidth = useCallback(() => {
    const nameElement = nameRef.current;
    const infoElement = infoRef.current;

    if (!nameElement || !infoElement) return false;

    const width = infoElement.offsetWidth - nameElement.offsetWidth;
    const halfTotalWidth = infoElement.offsetWidth / 2;

    return width > halfTotalWidth ? width : undefined;
  }, []);

  const throttledUpdateEllipseBalance = useThrottledCallback(() => {
    setBalanceMaxWidth(getRealBalanceMaxWidth);
    setEllipseBalance(getEllipseBalance());
  }, 500, []);

  useEffect(() => {
    setBalanceMaxWidth(getRealBalanceMaxWidth);
    setEllipseBalance(getEllipseBalance());

    window.addEventListener("resize", throttledUpdateEllipseBalance);

    return () => {
      window.removeEventListener("resize", throttledUpdateEllipseBalance);
    }
  }, [tokenInfo, balance, getEllipseBalance, throttledUpdateEllipseBalance]);

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

  const style: React.CSSProperties = {} as any;

  if (balanceOffset !== undefined) style["--balanceOffset"] = `${ balanceOffset }px`;
  if (balanceMaxWidth !== undefined) style["--balanceMaxWidth"] = `${ balanceMaxWidth }px`;

  const nameStyle: React.CSSProperties = {} as any;

  if (nameMarqueeOffset) {
    nameStyle.animation = `${ nameMarqueeOffset / 15 }s linear infinite alternate ${ styles.marqueeAnimation }`;
    nameStyle["--marqueeOffset"] = `${ -nameMarqueeOffset }px`;
  }

  const balanceStyle: React.CSSProperties = {} as any;

  if (balanceMarqueeOffset) {
    balanceStyle.animation = `${ balanceMarqueeOffset / 15 }s linear infinite alternate ${ styles.marqueeAnimation }`;
    balanceStyle["--marqueeOffset"] = `${ -balanceMarqueeOffset }px`;
  }

  return (
    <div className={ styles.root }>
      <TokenLogo
        key={`logo-${id}`}
        token={tokenInfo}
        style={{ flex: "0 0 auto", alignSelf: "center" }} />

      <div className={ styles.info } ref={ infoRef }>
        <Text variant="bodyMd" style={{ color: "#121212", ...nameStyle }} className={ styles.name } ref={ nameRef } onMouseEnter={ handleExpandName } onMouseLeave={ handleCollapse }>
          {tokenName}
        </Text>

        <div className={ clsx(styles.balanceAndPrice, { [styles.ellipseBalance]: ellipseBalance && !balanceMaxWidth && !balanceMarqueeOffset }) } style={style} ref={ balanceAndPriceRef }>
          <Text alignment="right" variant="bodyMd" style={{ color: "#121212" }} className={ styles.balance }>
            <span className={ styles.balanceAmountWrapper }>
              <span className={ styles.balanceAmount } ref={ balanceRef } style={ balanceStyle } onMouseEnter={ handleExpandBalance } onMouseLeave={ handleCollapse }>{ balance }</span>
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
