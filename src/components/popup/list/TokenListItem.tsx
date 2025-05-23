import styled from "styled-components";
import { formatAddress } from "~utils/format";
import { useTheme } from "~utils/theme";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import arLogoLight from "url:/assets/ar/logo_light.png";
import { getUserAvatar } from "~lib/avatar";
import type { Token } from "~tokens/token";
import { useLocation } from "~wallets/router/router.utils";
import { useEffect, useMemo, useState } from "react";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao";

export interface TokenListItemProps {
  token: Token;
  active: boolean;
  onClick?: () => void;
}

export function TokenListItem({ token, onClick }: TokenListItemProps) {
  const { navigate } = useLocation();

  // format address
  const formattedAddress = useMemo(() => formatAddress(token.id, 8), [token.id]);

  // display theme
  const theme = useTheme();

  const arweaveLogo = useMemo(() => (theme === "dark" ? arLogoDark : arLogoLight), [theme]);

  // token logo
  const [image, setImage] = useState(arweaveLogo);

  // gateway
  const gateway = useGateway(FULL_HISTORY);

  useEffect(() => {
    (async () => {
      try {
        // if it is a collectible, we don't need to determinate the logo
        if (token.type === "collectible") {
          return setImage(`${concatGatewayURL(gateway)}/${token.id}`);
        }

        if (token.defaultLogo) {
          const logo = await getUserAvatar(token.defaultLogo);
          return setImage(logo);
        } else {
          return setImage(arLogoDark);
        }
      } catch {
        setImage(arLogoDark);
      }
    })();
  }, [token, theme, gateway]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/quick-settings/tokens/${token.id}`);
    }
  };

  return (
    <DivListItem id={token.id} onClick={handleClick}>
      <DivTokenLogoWrapper>
        <ImgTokenLogo src={image} />
      </DivTokenLogoWrapper>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <DivTitleWrapper>{token.name}</DivTitleWrapper>
        <DivDescriptionWrapper>{token.id !== AR_PROCESS_ID && formattedAddress}</DivDescriptionWrapper>
      </div>
    </DivListItem>
  );
}

const DivDescriptionWrapper = styled.div`
  display: flex;
  gap: 8px;
  font-size: 0.625rem;
  color: ${(props) => props.theme.secondaryTextv2};
`;

const DivTitleWrapper = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: ${(props) => props.theme.primaryText};
`;

const DivListItem = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.secondaryItemHover};
    z-index: 0;
  }
`;

const DivTokenLogoWrapper = styled.div`
  position: relative;
  width: 2rem;
  height: 2rem;
  z-index: 1;

  &::before {
    background-color: white;
    content: "";
    position: absolute;
    top: 1px;
    left: 1px;
    right: 1px;
    bottom: 1px;
    border-radius: 28px;
    z-index: -1;
  }
`;

const ImgTokenLogo = styled.img.attrs({
  alt: "token-logo",
  draggable: false,
})`
  width: 2rem;
  border-radius: 29px;
  height: 2rem;
`;

const SpanTokenType = styled.span`
  padding: 0.08rem 0.2rem;
  background-color: rgb(${(props) => props.theme.theme});
  color: ${(props) => props.theme.primaryText};
  font-weight: 500;
  font-size: 0.5rem;
  text-transform: uppercase;
  margin-left: 0.45rem;
  width: max-content;
  border-radius: 5px;
`;
