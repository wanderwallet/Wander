import { formatFiatBalance } from "~tokens/currency";
import { type MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { hoverEffect } from "~utils/theme";
import { type Token } from "~tokens/token";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { Button, Text, Tooltip, type TextProps, type TooltipProps } from "@arconnect/components-rebrand";
import useSetting from "~settings/hook";
import styled from "styled-components";
import { formatAddress, formatBalance } from "~utils/format";
import Skeleton from "~components/Skeleton";
import { TrashIcon, PlusIcon, SettingsIcon } from "@iconicicons/react";
import BigNumber from "bignumber.js";
import JSConfetti from "js-confetti";
import { useTokenBalance } from "~tokens/hooks";
import { BalanceFetchError, NetworkError } from "~utils/error/error.utils";
import { ToggleSwitch } from "~components/ToggleSwitch";
import { TokenLogo } from "~components/popup/TokenLogo";
import { NetworkErrorIcon } from "~components/icons/NetworkErrorIcon";
import { WarningIcon } from "~components/icons/WarningIcon";
import { DegradedMessage, NetworkErrorMessage } from "~components/popup/tokens/ErrorMessages";
import { AO_PROCESS_ID, AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import browser from "webextension-polyfill";

export default function Token({ onClick, disableClickEffect, disableCursor, ...props }: Props) {
  const ref = useRef(null);
  const [totalBalance, setTotalBalance] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const [aoConfettiShown, setAoConfettiShown] = useState(true);

  const [activeAddress] = useStorage({
    key: "active_address",
    instance: ExtensionStorage,
  });

  const [currency] = useSetting("currency");

  const tokenInfo = useMemo(() => {
    return {
      id: props.id,
      processId: props.id,
      Ticker: props.ticker,
      Name: props.name,
      Denomination: props.divisibility,
      Logo: props.defaultLogo,
    };
  }, [props]);

  const { data: fractBalance = "0", isError, error, isLoading, isFetching } = useTokenBalance(tokenInfo, activeAddress);

  const balance = useMemo(() => {
    if (isError) return "0";
    const formattedBalance = formatBalance(BigNumber(fractBalance));
    setTotalBalance(formattedBalance.tooltipBalance);
    setShowTooltip(formattedBalance.showTooltip);
    return formattedBalance.displayBalance;
  }, [fractBalance, isError]);

  const fiatBalance = useMemo(() => {
    if (!props.fiatPrice) return undefined;
    const tokenBalance = fractBalance! || "0";
    return formatFiatBalance(BigNumber(tokenBalance).times(props.fiatPrice), currency);
  }, [fractBalance, props.fiatPrice, currency]);

  const formattedFiatPrice = useMemo(() => {
    if (!props.fiatPrice) return undefined;
    return formatFiatBalance(props.fiatPrice, currency);
  }, [props.fiatPrice, currency]);

  const handleOpenAoLink = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.stopPropagation();

      if (props.id !== AR_PROCESS_ID) {
        browser.tabs.create({ url: `https://ao.link/#/token/${props.id}` });
      }
    },
    [props.id],
  );

  // token logo

  const hasActionButton = props?.onAddClick || props?.onRemoveClick || props?.onSettingsClick || props?.onHideClick;

  const triggerConfetti = async () => {
    const jsConfetti = new JSConfetti({ canvas: ref.current });
    jsConfetti.addConfetti();
    setAoConfettiShown(true);
    await ExtensionStorage.set(`ao_confetti_shown_${activeAddress}`, true);
  };

  useEffect(() => {
    if (activeAddress && AO_PROCESS_ID === props.id) {
      ExtensionStorage.get<boolean>(`ao_confetti_shown_${activeAddress}`).then(setAoConfettiShown);
    }
  }, [AO_PROCESS_ID, props.id, activeAddress]);

  useEffect(() => {
    if (
      ref.current &&
      activeAddress &&
      !isLoading &&
      AO_PROCESS_ID === props.id &&
      !aoConfettiShown &&
      +fractBalance > 0
    ) {
      triggerConfetti();
    }
  }, [aoConfettiShown, activeAddress, fractBalance, isLoading]);

  return (
    <Wrapper disableClickEffect={disableClickEffect} disableCursor={disableCursor}>
      {(!aoConfettiShown || ref.current) && AO_PROCESS_ID === props.id && +fractBalance > 0 && <Canvas ref={ref} />}
      <InnerWrapper width={hasActionButton ? "86%" : "100%"} onClick={onClick}>
        <LogoAndDetails>
          <TokenLogo
            key={props.id}
            token={tokenInfo}
            name={props.name || props.ticker}
            fetchMissingLogo={props.fetchMissingLogo}
            isVerified={props.isVerified}
          />
          <div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <TokenName>{props.name || props.ticker || "???"}</TokenName>
              {props.showId && !props.addressOverFiat && (
                <Address size={props.addressSize || "base"}>{formatAddress(props.id, 3)}</Address>
                // <Tooltip content={props.id} position="top">
                // </Tooltip>
              )}
            </div>
            {hasActionButton ? (
              <FiatBalance>{balance}</FiatBalance>
            ) : props.addressOverFiat ? (
              <Address
                size={props.addressSize || "base"}
                showAsLink={props.id !== AR_PROCESS_ID}
                onClick={handleOpenAoLink}>
                {formatAddress(props.id, 4)}
              </Address>
            ) : (
              formattedFiatPrice && <FiatBalance>{formattedFiatPrice}</FiatBalance>
            )}
          </div>
        </LogoAndDetails>

        {!hasActionButton && (
          <BalanceSection>
            {isLoading ? (
              <Skeleton width="80px" height="20px" />
            ) : error instanceof BalanceFetchError ? (
              <MessageTooltip content={DegradedMessage} position="left">
                <WarningIcon />
              </MessageTooltip>
            ) : error instanceof NetworkError ? (
              <MessageTooltip content={NetworkErrorMessage} position="left">
                <NetworkErrorIcon />
              </MessageTooltip>
            ) : (
              <>
                {showTooltip ? (
                  <BalanceTooltip content={totalBalance} position={props.balanceTooltipPosition || "topEnd"}>
                    <NativeBalance $isFetching={isFetching && !isLoading}>{balance}</NativeBalance>
                  </BalanceTooltip>
                ) : (
                  <NativeBalance $isFetching={isFetching && !isLoading}>{balance}</NativeBalance>
                )}
              </>
            )}

            <FiatBalance $isFetching={isFetching && !isLoading}>{fiatBalance}</FiatBalance>
          </BalanceSection>
        )}
      </InnerWrapper>
      {hasActionButton && (
        <div style={{ zIndex: 1 }}>
          {props?.onAddClick ? (
            <Button fullWidth onClick={props.onAddClick} style={{ padding: 0, minWidth: 40, maxWidth: 40 }}>
              <PlusIcon />
            </Button>
          ) : props?.onSettingsClick ? (
            <Button fullWidth onClick={props.onSettingsClick} style={{ padding: 0, minWidth: 40, maxWidth: 40 }}>
              <SettingsIcon />
            </Button>
          ) : props?.onHideClick ? (
            <ToggleSwitch
              width={51}
              height={31}
              checked={!props.hidden}
              setChecked={(checked) => props.onHideClick(!checked)}
            />
          ) : (
            props?.onRemoveClick && (
              <Button fullWidth onClick={props.onRemoveClick} style={{ padding: 0, minWidth: 40, maxWidth: 40 }}>
                <TrashIcon />
              </Button>
            )
          )}
        </div>
      )}
    </Wrapper>
  );
}

export const Wrapper = styled.div<{
  disableClickEffect?: boolean;
  disableCursor?: boolean;
}>`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: ${({ disableCursor }) => (disableCursor ? "default" : "pointer")};
  transition: all 0.07s ease-in-out;

  ${({ disableClickEffect }) =>
    !disableClickEffect &&
    `
      &:active {
        transform: scale(0.98);
        opacity: 0.8;
      }`}

  ${hoverEffect}

  &::after {
    width: 105%;
    height: 130%;
    border-radius: 12px;
  }
`;

export const InnerWrapper = styled.div<{ width: string }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: ${(props) => props.width};
`;

const BalanceTooltip = styled(Tooltip)`
  margin-right: ${(props) => (props.position === "left" ? "0" : "1rem")};
`;

const MessageTooltip = styled(Tooltip)`
  max-width: 270px;
`;

export const LogoAndDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

export const TokenName = styled(Text).attrs({
  noMargin: true,
  weight: "semibold",
  lineHeight: 1.4,
})``;

const Address = styled(Text).attrs({
  noMargin: true,
  weight: "light",
  lineHeight: 1.4,
})<{ showAsLink?: boolean }>`
  color: ${(props) => props.theme.secondaryText};

  ${({ showAsLink, theme }) =>
    showAsLink &&
    `
      &:hover {
        text-decoration: underline;
        cursor: pointer;
        color: ${theme.theme};
      }
    `}
`;

const NativeBalance = styled(Text).attrs({
  noMargin: true,
  weight: "semibold",
  size: "md",
})<{ $isFetching?: boolean }>`
  opacity: ${({ $isFetching }) => ($isFetching ? 0.6 : 1)};
  transition: opacity 0.2s ease;
`;

const FiatBalance = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "sm",
  variant: "secondary",
})<{ $isFetching?: boolean }>`
  opacity: ${({ $isFetching }) => ($isFetching ? 0.6 : 1)};
  transition: opacity 0.2s ease;
`;

const BalanceSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  flex-shrink: 0;

  p,
  span {
    text-align: right;
  }
`;

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`;

interface Props extends Omit<Token, "balance"> {
  showId?: boolean;
  ao?: boolean;
  fiatPrice?: number;
  onAddClick?: MouseEventHandler<HTMLButtonElement>;
  onRemoveClick?: MouseEventHandler<HTMLButtonElement>;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
  onHideClick?: (hidden: boolean) => void;
  onClick?: MouseEventHandler<HTMLDivElement>;
  disableClickEffect?: boolean;
  disableCursor?: boolean;
  /** If true, the address will be shown instead of the fiat balance */
  addressOverFiat?: boolean;
  /** Size of the address text. Defaults to "sm" */
  addressSize?: TextProps["size"];
  /** If true, fetch missing token logo from cache or ao */
  fetchMissingLogo?: boolean;
  isVerified?: boolean;
  balanceTooltipPosition?: TooltipProps["position"];
}
