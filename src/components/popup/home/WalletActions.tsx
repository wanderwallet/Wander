import { Button } from "@arconnect/components-rebrand";
import { QrCode02 } from "@untitled-ui/icons-react";
import styled from "styled-components";
import type { WanderRoutePath } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import arLogoDark from "url:/assets/ar/logo_dark.png";

export default function WalletActions() {
  const { navigate } = useLocation();

  return (
    <Container>
      <BuyArButton
        onClick={() => navigate("/purchase" as WanderRoutePath)}
        variant="primary"
        icon={<img src={arLogoDark} style={{ height: 18.5, width: 18.5 }} alt="Buy AR" />}
        iconPosition="right">
        {browser.i18n.getMessage("buy_ar_button")}
      </BuyArButton>
      <ActionButtonsContainer>
        <ActionButton
          onClick={() => navigate("/send/transfer" as WanderRoutePath)}
          variant="secondary"
          icon={<ReceiveIcon flipped={true} />}
        />
        <ActionButton
          onClick={() => navigate("/receive" as WanderRoutePath)}
          variant="secondary"
          icon={<QrCode02 style={{ height: 26, width: 26 }} />}
        />
      </ActionButtonsContainer>
    </Container>
  );
}

const ReceiveIcon = ({ flipped = false }: { flipped?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 57 56"
    fill="none"
    style={flipped && { transform: "rotate(180deg)", flexShrink: 0 }}>
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M25.6415 9.86579L16.6545 39.3722C16.3165 40.6939 16.6632 41.3116 18.0827 40.9486L47.6499 31.9368L34.2169 25.5655L19.479 38.1054L32.019 23.3676L25.6415 9.86579Z"
      fill="currentColor"
    />
  </svg>
);

const BuyArButton = styled(Button)`
  width: 50%;
  box-sizing: border-box;
`;

const ActionButton = styled(Button)`
  width: calc(50% - 4px);
  box-sizing: border-box;
  min-width: 0;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  width: 50%;
  gap: 8px;
  box-sizing: border-box;
`;

const Container = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`;
