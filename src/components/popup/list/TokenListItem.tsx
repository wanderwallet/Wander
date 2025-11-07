import styled from "styled-components";
import { formatAddress } from "~utils/format";
import type { Token } from "~tokens/token";
import { useLocation } from "~wallets/router/router.utils";
import { useMemo } from "react";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { TokenLogo } from "~components/popup/TokenLogo";

export interface TokenListItemProps {
  token: Token;
  active: boolean;
  onClick?: () => void;
}

export function TokenListItem({ token, onClick }: TokenListItemProps) {
  const { navigate } = useLocation();

  // format address
  const formattedAddress = useMemo(() => formatAddress(token.id, 8), [token.id]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/quick-settings/tokens/${token.id}`);
    }
  };

  return (
    <DivListItem id={token.id} onClick={handleClick}>
      <TokenLogo token={token} />

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
  flex-shrink: 0;

  &:hover {
    background-color: ${(props) => props.theme.secondaryItemHover};
    z-index: 0;
  }
`;
