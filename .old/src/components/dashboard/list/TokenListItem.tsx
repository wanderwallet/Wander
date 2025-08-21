import { type Token } from "~tokens/token";
import { Reorder, useDragControls } from "framer-motion";
import { useMemo } from "react";
import { ListItem } from "@arconnect/components-rebrand";
import { formatAddress } from "~utils/format";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { AR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import { TokenLogo } from "~components/popup/TokenLogo";

import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import arLogo from "url:/assets/ecosystem/ar-logo.svg";

export default function TokenListItem({ token, active, onClick }: Props) {
  const { navigate } = useLocation();

  // format address
  const formattedAddress = useMemo(
    () => (token.id === AR_PROCESS_ID ? AR_PROCESS_ID : formatAddress(token.id, 8)),
    [token.id],
  );

  // allow dragging with the drag icon
  const dragControls = useDragControls();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/tokens/${token.id}`);
    }
  };

  return (
    <Reorder.Item
      as="div"
      value={token}
      id={token.id}
      dragListener={false}
      dragControls={dragControls}
      onClick={handleClick}>
      <ListItem
        title={`${token.name} (${token.ticker})`}
        subtitle={
          <DescriptionWrapper>
            {formattedAddress}
            <ImgAoLogo src={token.id === AR_PROCESS_ID ? arLogo : aoLogo} alt="AO logo" />
          </DescriptionWrapper>
        }
        hideSquircle
        active={active}
        dragControls={null}
        icon={<TokenLogo token={token} />}
        height={64}
      />
    </Reorder.Item>
  );
}

const ImgAoLogo = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

interface Props {
  token: Token;
  ao?: boolean;
  active: boolean;
  onClick?: () => void;
}
