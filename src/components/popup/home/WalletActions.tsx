import styled from "styled-components";
import browser from "webextension-polyfill";
import { useLocation, type NavigateAction } from "~wallets/router/router.utils";

export default function WalletActions() {
  const { navigate } = useLocation();

  return (
    <Container>
      {actions.map((action) => (
        <ActionItem
          key={action.name}
          onClick={() => navigate(action.route as NavigateAction)}
        >
          <CircleButton>{action.icon}</CircleButton>
          <span>{browser.i18n.getMessage(action.label)}</span>
        </ActionItem>
      ))}
    </Container>
  );
}

const SendIcon = () => (
  <svg
    width="57"
    height="59"
    viewBox="0 0 57 59"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M31.8038 46.5175L40.7908 17.0111C41.1288 15.6894 40.7821 15.0717 39.3626 15.4347L9.79538 24.4465L23.2284 30.8178L37.9663 18.2779L25.4263 33.0157L31.8038 46.5175Z"
      fill="#FFFEFC"
    />
  </svg>
);

const ReceiveIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="57"
    height="56"
    viewBox="0 0 57 56"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M25.6415 9.86579L16.6545 39.3722C16.3165 40.6939 16.6632 41.3116 18.0827 40.9486L47.6499 31.9368L34.2169 25.5655L19.479 38.1054L32.019 23.3676L25.6415 9.86579Z"
      fill="#FFFEFC"
    />
  </svg>
);

const BuyIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="57"
    height="56"
    viewBox="0 0 57 56"
    fill="none"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M28.7754 43.118C37.0597 43.118 43.7754 36.4022 43.7754 28.118C43.7754 19.8337 37.0597 13.118 28.7754 13.118C20.4911 13.118 13.7754 19.8337 13.7754 28.118C13.7754 36.4022 20.4911 43.118 28.7754 43.118ZM28.8337 20.2097C29.6621 20.2097 30.3337 20.8813 30.3337 21.7097V26.8129H35.4369C36.2654 26.8129 36.9369 27.4845 36.9369 28.3129C36.9369 29.1414 36.2654 29.8129 35.4369 29.8129H30.3337V34.9162C30.3337 35.7446 29.6621 36.4162 28.8337 36.4162C28.0053 36.4162 27.3337 35.7446 27.3337 34.9162V29.8129H22.2305C21.402 29.8129 20.7305 29.1414 20.7305 28.3129C20.7305 27.4845 21.402 26.8129 22.2305 26.8129H27.3337V21.7097C27.3337 20.8813 28.0053 20.2097 28.8337 20.2097Z"
      fill="#FFFEFC"
    />
  </svg>
);

const actions = [
  {
    name: "send",
    label: "send",
    icon: <SendIcon />,
    route: "/send/transfer"
  },
  {
    name: "receive",
    label: "receive",
    icon: <ReceiveIcon />,
    route: "/receive"
  },
  {
    name: "buy",
    label: "buy",
    icon: <BuyIcon />,
    route: "/purchase"
  }
];

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 32px;
`;

const CircleButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;

  background: linear-gradient(47deg, #5842f8 5.41%, #6b57f9 96%);

  &:hover {
    background: #503ece;
  }

  &:active {
    background: ${({ theme }) =>
      theme.displayTheme === "dark" ? "#2A2260" : "#E3E1FA"};
  }
`;

const ActionItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;

  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.2px;
  color: ${({ theme }) => (theme.displayTheme === "dark" ? "#AAA" : "#666")};
  &:hover,
  &:active {
    color: ${({ theme }) =>
      theme.displayTheme === "dark" ? "#75747D" : "#878596"};
  }
`;
