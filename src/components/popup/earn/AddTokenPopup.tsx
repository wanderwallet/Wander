import browser from "webextension-polyfill";
import SliderMenu from "~components/SliderMenu";
import { Input, Section, useInput } from "@arconnect/components-rebrand";
import styled from "styled-components";
import { useCallback, useEffect, useMemo, useState, type MouseEventHandler } from "react";
import { useTheme } from "~utils/theme";
import { type Token } from "~tokens/token";
import { Text, useToasts } from "@arconnect/components-rebrand";
import arLogoLight from "url:/assets/ar/logo_light.png";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { getUserAvatar } from "~lib/avatar";
import { ToggleSwitch } from "~components/ToggleSwitch";
import type { FlpTokenInfo } from "~utils/fair_launch/fair_launch.types";
import { useActiveAddress } from "~wallets/hooks";
import { InnerWrapper, Logo, LogoAndDetails, TokenName, Wrapper } from "../Token";

interface Props {
  open: boolean;
  close: () => void;
  tokens: FlpTokenInfo[];
  delegationInfo: Record<string, number>;
  setDelegationInfo: React.Dispatch<React.SetStateAction<Record<string, number>>>;
}

export function AddTokenPopup({ open, close, tokens, delegationInfo, setDelegationInfo }: Props) {
  const { setToast } = useToasts();
  const searchInput = useInput();
  const activeAddress = useActiveAddress();

  const filteredTokens = useMemo(() => {
    if (!tokens) return [];
    if (!searchInput.state) return tokens;
    const searchValue = searchInput.state.toLowerCase();
    return tokens.filter((token) => {
      const ticker = token?.Ticker?.toLowerCase();
      const name = token?.Name?.toLowerCase();
      return ticker?.includes(searchValue) || name?.includes(searchValue);
    });
  }, [tokens, searchInput.state]);

  const handleHideClick = useCallback(
    (token: FlpTokenInfo, hidden: boolean) => {
      if (!hidden) {
        const total = Object.values(delegationInfo).reduce((acc, curr) => acc + curr, 0);
        const aoDelegation = delegationInfo[activeAddress] || 0;
        if (total === 100 && aoDelegation === 0) {
          setToast({
            type: "error",
            content: "Please remove some tokens allocation to add a new one",
            duration: 2400,
          });
          return false;
        }
      }

      setDelegationInfo((prev) => {
        const aoDelegation = prev[activeAddress] || 0;
        const tokenDelegation = prev[token.flpId] || 0;
        if (hidden) {
          const { [token.flpId]: _, ...rest } = prev;
          return {
            ...rest,
            [activeAddress]: aoDelegation + tokenDelegation,
          };
        }

        return {
          ...prev,
          [token.flpId]: 5,
          [activeAddress]: aoDelegation - 5,
        };
      });
    },
    [activeAddress, delegationInfo, setDelegationInfo],
  );

  return (
    <SliderMenu
      hasHeader={true}
      title={browser.i18n.getMessage("add_token")}
      height="90vh"
      maxHeight="95vh"
      isOpen={open}
      onClose={close}>
      <Container>
        <div>
          <Input fullWidth variant="search" placeholder="Search token" {...searchInput.bindings} />
        </div>

        <TokensList>
          {filteredTokens.map((token) => (
            <Token
              disabled={token.flpId === activeAddress}
              disableCursor={true}
              key={token.processId}
              defaultLogo={token?.Logo}
              id={token.processId}
              name={token.Name}
              ticker={token.Ticker}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              hidden={!delegationInfo[token.flpId]}
              onHideClick={(hidden) => handleHideClick(token, hidden)}
              disableClickEffect
            />
          ))}
        </TokensList>
      </Container>
    </SliderMenu>
  );
}

function Token({ onClick, disableClickEffect, disableCursor, disabled, ...props }: TokenProps) {
  const theme = useTheme();
  const arweaveLogo = useMemo(() => (theme === "dark" ? arLogoDark : arLogoLight), [theme]);
  const [logo, setLogo] = useState<string>();

  useEffect(() => {
    const fetchLogo = async () => {
      if (!props?.id) return;
      if (props.defaultLogo) {
        const logo = await getUserAvatar(props.defaultLogo);
        setLogo(logo);
      } else {
        setLogo(arweaveLogo);
      }
    };
    fetchLogo();
  }, [props.id, props.defaultLogo, arweaveLogo]);

  return (
    <Wrapper disableClickEffect={disableClickEffect} disableCursor={disableCursor}>
      <InnerWrapper width={"86%"} onClick={onClick}>
        <LogoAndDetails>
          <Logo src={logo || ""} alt="" key={props.id} />
          <div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <TokenName>{props.name}</TokenName>
            </div>
            <TokenTicker>${props.ticker}</TokenTicker>
          </div>
        </LogoAndDetails>
      </InnerWrapper>

      <div style={{ zIndex: 1 }}>
        <ToggleSwitch
          disabled={disabled}
          width={51}
          height={31}
          checked={!props.hidden}
          setChecked={(checked) => props.onHideClick(!checked)}
        />
      </div>
    </Wrapper>
  );
}

interface TokenProps extends Omit<Token, "balance" | "type"> {
  onHideClick?: (hidden: boolean) => void;
  onClick?: MouseEventHandler<HTMLDivElement>;
  disableClickEffect?: boolean;
  disableCursor?: boolean;
  disabled?: boolean;
}

const TokenTicker = styled(Text).attrs({
  noMargin: true,
  weight: "medium",
  size: "xs",
  variant: "secondary",
})``;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 1.5rem;
`;

const TokensList = styled(Section)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0;
  padding-bottom: 1.5rem;
`;
