import { formatFiatBalance } from "~tokens/currency";
import { type MouseEventHandler, useEffect, useMemo, useRef, useState } from "react";
import { hoverEffect } from "~utils/theme";
import { type Token } from "~tokens/token";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { Button, Text, Tooltip } from "@arconnect/components-rebrand";
import { useArPrice } from "~lib/coingecko";
import arLogoLight from "url:/assets/ar/logo_light.png";
import Squircle from "~components/Squircle";
import useSetting from "~settings/hook";
import styled from "styled-components";
import { getUserAvatar } from "~lib/avatar";
import { formatAddress, formatBalance } from "~utils/format";
import Skeleton from "~components/Skeleton";
import { TrashIcon, PlusIcon, SettingsIcon } from "@iconicicons/react";
import BigNumber from "bignumber.js";
import JSConfetti from "js-confetti";
import { useBalance } from "~wallets/hooks";
import { useTokenBalance } from "~tokens/hooks";
import { BalanceFetchError, NetworkError } from "~utils/error/error.utils";
import { ToggleSwitch } from "~components/ToggleSwitch";
import Image from "~components/common/Image";
import { AO_PROCESS_ID } from "~tokens/aoTokens/ao";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { NetworkErrorIcon } from "~components/icons/NetworkErrorIcon";
import { WarningIcon } from "~components/icons/WarningIcon";
import { DegradedMessage, NetworkErrorMessage } from "~components/popup/tokens/ErrorMessages";

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

  const { data: fractBalance = "0", isError, error, isLoading } = useTokenBalance(tokenInfo, activeAddress);

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

  // token logo
  const [logo, setLogo] = useState<string>();

  const hasActionButton = props?.onAddClick || props?.onRemoveClick || props?.onSettingsClick || props?.onHideClick;

  const triggerConfetti = async () => {
    const jsConfetti = new JSConfetti({ canvas: ref.current });
    jsConfetti.addConfetti();
    setAoConfettiShown(true);
    await ExtensionStorage.set(`ao_confetti_shown_${activeAddress}`, true);
  };

  useEffect(() => {
    const fetchLogo = async () => {
      if (!props?.id || logo) return;
      if (props.defaultLogo) {
        const logo = await getUserAvatar(props.defaultLogo);
        setLogo(logo);
      } else {
        setLogo(arLogoLight);
      }
    };
    fetchLogo();
  }, [props, logo]);

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
          <Logo src={logo || ""} alt="" key={props.id} />
          <div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <TokenName>{props.name || props.ticker || "???"}</TokenName>
              {props.showId && (
                <Address>{formatAddress(props.id, 3)}</Address>
                // <Tooltip content={props.id} position="top">
                // </Tooltip>
              )}
            </div>
            {hasActionButton ? (
              <FiatBalance>{balance}</FiatBalance>
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
                  <BalanceTooltip content={totalBalance} position="topEnd">
                    <NativeBalance>{balance}</NativeBalance>
                  </BalanceTooltip>
                ) : (
                  <NativeBalance>{balance}</NativeBalance>
                )}
              </>
            )}

            <FiatBalance>{fiatBalance}</FiatBalance>
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
  margin-right: 1rem;
`;

const MessageTooltip = styled(Tooltip)`
  max-width: 290px;
`;

export const LogoAndDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

// TODO: this could be removed to the components it's being used in
export const LogoWrapper = styled(Squircle)<{ small?: boolean }>`
  position: relative;
  width: ${(props) => (props.small ? "2.1875rem" : "2.8rem;")};
  height: ${(props) => (props.small ? "2.1875rem" : "2.8rem;")};
  flex-shrink: 0;
  color: rgba(${(props) => props.theme.theme}, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Logo = styled(Image).attrs({
  draggable: false,
})<{ width?: number; height?: number }>`
  position: relative;
  flex-shrink: 0;
  border-radius: 29px;
  object-fit: cover;
  overflow: hidden;
  z-index: 1;
  width: ${(props) => (props.width ? `${props.width}px` : "40px")};
  height: ${(props) => (props.height ? `${props.height}px` : "40px")};

  &::before {
    content: "";
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    background-color: #fffefc;
    border-radius: 28px;
    z-index: -1;
  }

  ${(props) =>
    props.theme.displayTheme === "light" &&
    `
      border: 1px solid #E4E4EB;
      box-shadow: 0px 1px 3px 0px rgba(0, 0, 0, 0.10), 0px 1px 2px 0px rgba(0, 0, 0, 0.06);
    `}
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
})`
  color: ${(props) => props.theme.secondaryTextv2};
`;

const NativeBalance = styled(Text).attrs({
  noMargin: true,
  weight: "semibold",
  size: "md",
})``;

const FiatBalance = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "sm",
  variant: "secondary",
})``;

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
}

// TODO: can this component be removed?
export function ArToken({ onClick, disableClickEffect, disableCursor, ...props }: ArTokenProps) {
  // currency setting
  const [currency] = useSetting<string>("currency");

  // load arweave price
  const { data: price = "0" } = useArPrice(currency);
  const { data: balance = "0", isLoading, error } = useBalance();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage,
  });

  // load ar balance
  const [displayBalance, setDisplayBalance] = useState("0");
  const [totalBalance, setTotalBalance] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);

  const hasActionButton = props?.onAddClick || props?.onRemoveClick || props?.onSettingsClick || props?.onHideClick;

  useAsyncEffect(async () => {
    if (!activeAddress) return;

    const formattedBalance = formatBalance(balance);
    setTotalBalance(formattedBalance.tooltipBalance);
    setShowTooltip(formattedBalance.showTooltip);
    setDisplayBalance(formattedBalance.displayBalance);
  }, [activeAddress, balance]);

  const formattedFiatPrice = useMemo(() => {
    if (!price) return undefined;
    return formatFiatBalance(price, currency);
  }, [price, currency]);

  const fiatBalance = useMemo(() => {
    if (!price) return undefined;
    return formatFiatBalance(BigNumber(balance).multipliedBy(price).toString(), currency);
  }, [balance, price, currency]);

  return (
    <Wrapper onClick={onClick} disableClickEffect={disableClickEffect} disableCursor={disableCursor}>
      <InnerWrapper width={hasActionButton ? "86%" : "100%"} onClick={onClick}>
        <LogoAndDetails>
          <Logo src={arLogoLight} />
          <div>
            <TokenName>AR</TokenName>
            {hasActionButton ? (
              <FiatBalance>{balance}</FiatBalance>
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
                  <BalanceTooltip content={totalBalance} position="topEnd">
                    <NativeBalance>{displayBalance}</NativeBalance>
                  </BalanceTooltip>
                ) : (
                  <NativeBalance>{displayBalance}</NativeBalance>
                )}
              </>
            )}

            <FiatBalance>{fiatBalance}</FiatBalance>
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

interface ArTokenProps extends Props {}
