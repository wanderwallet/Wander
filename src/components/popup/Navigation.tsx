import { Compass03, Grid01, Home05, Users01 } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";

const Home05Active = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M11.7273 1.33636C12.0696 1.24368 12.4304 1.24368 12.7727 1.33636C13.1701 1.44395 13.5046 1.7066 13.7716 1.91623C16.075 3.72462 18.3928 5.51471 20.7063 7.31011C21.0829 7.6024 21.4147 7.8599 21.662 8.19421C21.879 8.48759 22.0406 8.8181 22.139 9.1695C22.2511 9.56992 22.2506 9.98993 22.2501 10.4667C22.2475 12.924 22.25 15.3813 22.25 17.8386C22.25 18.3657 22.2501 18.8204 22.2194 19.195C22.1871 19.5904 22.1158 19.9836 21.923 20.362C21.6354 20.9264 21.1765 21.3854 20.612 21.673C20.2336 21.8658 19.8404 21.9371 19.445 21.9694C18.6435 22.0349 17.8306 21.9996 17.0269 22C16.9078 22 16.7655 22.0001 16.6402 21.9899C16.495 21.978 16.287 21.9475 16.069 21.8365C15.7868 21.6927 15.5573 21.4632 15.4135 21.181C15.3025 20.963 15.272 20.755 15.2601 20.6098C15.2499 20.4845 15.25 20.3422 15.25 20.2231L15.2579 14.6269C15.2587 14.0661 15.2591 13.7857 15.1502 13.5715C15.0544 13.3831 14.9014 13.2298 14.7131 13.1338C14.499 13.0246 14.2187 13.0246 13.6579 13.0246H10.858C10.2987 13.0246 10.019 13.0246 9.80528 13.1334C9.61725 13.2291 9.46431 13.3818 9.36834 13.5697C9.25923 13.7833 9.25884 14.063 9.25804 14.6223L9.25002 20.2231C9.25007 20.3422 9.25012 20.4845 9.23988 20.6098C9.22802 20.755 9.19758 20.963 9.08653 21.181C8.94272 21.4632 8.71325 21.6927 8.431 21.8365C8.21306 21.9475 8.00507 21.978 7.85985 21.9899C7.73453 22.0001 7.59228 22 7.47317 22C6.66948 21.9996 5.85651 22.0349 5.05499 21.9694C4.65964 21.9371 4.26643 21.8658 3.88805 21.673C3.32356 21.3854 2.86462 20.9264 2.577 20.362C2.3842 19.9836 2.31289 19.5904 2.28059 19.195C2.24998 18.8204 2.25 18.3657 2.25002 17.8385C2.25002 15.3812 2.2526 12.9239 2.24995 10.4667C2.24943 9.98993 2.24898 9.56992 2.36106 9.1695C2.45942 8.8181 2.62107 8.48759 2.83806 8.19421C3.08532 7.85991 3.41713 7.6024 3.79376 7.31012C6.1072 5.51479 8.42512 3.72458 10.7284 1.91623C10.9954 1.7066 11.33 1.44395 11.7273 1.33636Z"
      fill="#6B57F9"
    />
  </svg>
);

const Compass03Active = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="24"
    viewBox="0 0 25 24"
    fill="none"
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M12.6459 3C7.67531 3 3.64587 7.02944 3.64587 12C3.64587 16.9706 7.67531 21 12.6459 21C17.6164 21 21.6459 16.9706 21.6459 12C21.6459 7.02944 17.6164 3 12.6459 3ZM15.6055 8.79222C15.4726 8.74483 15.2728 8.81145 14.873 8.94469L11.2218 10.1618C11.108 10.1997 11.051 10.2187 11.0038 10.251C10.9619 10.2797 10.9257 10.3158 10.8971 10.3577C10.8648 10.405 10.8458 10.4619 10.8078 10.5757L9.59075 14.227C9.45751 14.6267 9.39089 14.8266 9.43828 14.9595C9.47953 15.0751 9.57054 15.1662 9.6862 15.2074C9.81911 15.2548 10.019 15.1882 10.4187 15.0549L14.0699 13.8378C14.1838 13.7999 14.2407 13.7809 14.288 13.7486C14.3298 13.72 14.366 13.6838 14.3947 13.6419C14.427 13.5946 14.446 13.5377 14.4839 13.4239L15.701 9.77263C15.8342 9.37291 15.9008 9.17305 15.8535 9.04014C15.8122 8.92448 15.7212 8.83347 15.6055 8.79222Z"
      fill="#6B57F9"
    />
  </svg>
);

const buttons = [
  {
    title: "Home",
    dictionaryKey: "home",
    icon: <Home05 />,
    iconActive: <Home05Active />,
    size: "24px",
    route: "/"
  },
  {
    title: "Explore",
    dictionaryKey: "explore",
    icon: <Compass03 />,
    iconActive: <Compass03Active />,
    size: "24px",
    route: "/explore"
  },
  {
    title: "Menu",
    dictionaryKey: "menu",
    icon: <Grid01 />,
    iconActive: <Grid01 color="#6B57F9" fill="#6B57F9" />,
    size: "24px",
    route: "/quick-settings"
  },
  {
    title: "Accounts",
    dictionaryKey: "accounts",
    icon: <Users01 />,
    iconActive: <Users01 color="#6B57F9" fill="#6B57F9" />,
    size: "24px",
    route: "/quick-settings/wallets"
  }
] as const;

export const NavigationBar = () => {
  const { location, navigate } = useLocation();

  const shouldShowNavigationBar = buttons.some((button) => {
    if (button.route === "/quick-settings/wallets") return false;
    return location === button.route;
  });

  if (!shouldShowNavigationBar) {
    return null;
  }

  return (
    <NavigationBarWrapper>
      {buttons.map((button, index) => {
        const active = button.route === location;
        return (
          <NavigationButton
            active={active}
            key={index}
            onClick={() => navigate(button.route)}
          >
            <IconWrapper size={button.size}>
              {active ? button.iconActive : button.icon}
            </IconWrapper>
            <div>{browser.i18n.getMessage(button.dictionaryKey)}</div>
          </NavigationButton>
        );
      })}
    </NavigationBarWrapper>
  );
};

const NavigationBarWrapper = styled.nav`
  z-index: 5;
  border-top: 0.75px solid ${(props) => props.theme.borderDefault};
  position: fixed;
  bottom: 0;
  height: 68px;
  background-color: ${(props) => props.theme.backgroundv2};
  width: 100%;
  display: flex;
  box-sizing: border-box;
`;

const NavigationButton = styled.button<{
  active?: boolean;
}>`
  color: ${(props) =>
    props.active ? props.theme.primaryText : props.theme.secondaryText};
  font-weight: 600;
  font-size: 12px;
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: transparent;
  border: 0;
  flex: 1 0 0;
  min-width: 0;
  gap: 4px;
  transition: color linear 250ms;

  &:hover {
    color: ${(props) => props.theme.primaryText};
  }
`;

const IconWrapper = styled.div<{ size: string }>`
  color: inherit;
  width: ${(props) => props.size};
  height: ${(props) => props.size};
  display: flex;
  justify-content: center;
  align-items: center;
`;
