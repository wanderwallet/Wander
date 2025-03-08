import { type Token } from "~tokens/token";
import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ListItem } from "@arconnect/components-rebrand";
import { formatAddress } from "~utils/format";
import { useTheme } from "~utils/theme";
import styled from "styled-components";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";
import aoLogo from "url:/assets/ecosystem/ao-logo.svg";
import arLogo from "url:/assets/ecosystem/ar-logo.svg";
import arLogoDark from "url:/assets/ar/logo_dark.png";
import { getUserAvatar } from "~lib/avatar";
import { useLocation } from "~wallets/router/router.utils";
import CommonImage from "~components/common/Image";

export default function TokenListItem({ token, active, onClick }: Props) {
  const { navigate } = useLocation();

  // format address
  const formattedAddress = useMemo(
    () => (token.id === "AR" ? "AR" : formatAddress(token.id, 8)),
    [token.id]
  );

  // allow dragging with the drag icon
  const dragControls = useDragControls();

  // display theme
  const theme = useTheme();

  // token logo
  const [image, setImage] = useState(arLogoDark);

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
      onClick={handleClick}
    >
      <ListItem
        title={`${token.name} (${token.ticker})`}
        subtitle={
          <DescriptionWrapper>
            {formattedAddress}
            <Image src={token.id === "AR" ? arLogo : aoLogo} alt="ao logo" />
          </DescriptionWrapper>
        }
        hideSquircle
        active={active}
        dragControls={null}
        icon={<TokenLogo src={image} />}
        height={64}
      />
    </Reorder.Item>
  );
}

const Image = styled.img`
  width: 16px;
  padding: 0 8px;
  border: 1px solid rgb(${(props) => props.theme.cardBorder});
  border-radius: 2px;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  gap: 8px;
`;

export const TokenLogo = styled(CommonImage).attrs({
  alt: "token-logo",
  draggable: false,
  backgroundColor: "#fffefc"
})`
  height: 40px;
  width: 40px;
  border-radius: 50%;
`;

interface Props {
  token: Token;
  ao?: boolean;
  active: boolean;
  onClick?: () => void;
}
