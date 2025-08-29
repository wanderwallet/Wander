import { CurrencyDollarCircle, Grid01, Home05 } from "@untitled-ui/icons-react";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { useLocation } from "~wallets/router/router.utils";
import { IS_EMBEDDED_APP } from "~utils/_embedded/embedded.constants";
import { useStorage, ExtensionStorage } from "~utils/storage";
import type { WanderRoutePath } from "~wallets/router/router.types";
import HedgehogHeadIcon from "url:/assets/agents/images/hedgehog-head.svg";
import { useAOMintingStatus } from "../../../../../libs/core/src/lib/utils/agents/hooks";
import { EventType, trackEvent } from "~utils/analytics";
import { useHasClaimableBalance } from "~utils/fair_launch/fair_launch.hooks";

const Home05Active = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11.7273 1.33636C12.0696 1.24368 12.4304 1.24368 12.7727 1.33636C13.1701 1.44395 13.5046 1.7066 13.7716 1.91623C16.075 3.72462 18.3928 5.51471 20.7063 7.31011C21.0829 7.6024 21.4147 7.8599 21.662 8.19421C21.879 8.48759 22.0406 8.8181 22.139 9.1695C22.2511 9.56992 22.2506 9.98993 22.2501 10.4667C22.2475 12.924 22.25 15.3813 22.25 17.8386C22.25 18.3657 22.2501 18.8204 22.2194 19.195C22.1871 19.5904 22.1158 19.9836 21.923 20.362C21.6354 20.9264 21.1765 21.3854 20.612 21.673C20.2336 21.8658 19.8404 21.9371 19.445 21.9694C18.6435 22.0349 17.8306 21.9996 17.0269 22C16.9078 22 16.7655 22.0001 16.6402 21.9899C16.495 21.978 16.287 21.9475 16.069 21.8365C15.7868 21.6927 15.5573 21.4632 15.4135 21.181C15.3025 20.963 15.272 20.755 15.2601 20.6098C15.2499 20.4845 15.25 20.3422 15.25 20.2231L15.2579 14.6269C15.2587 14.0661 15.2591 13.7857 15.1502 13.5715C15.0544 13.3831 14.9014 13.2298 14.7131 13.1338C14.499 13.0246 14.2187 13.0246 13.6579 13.0246H10.858C10.2987 13.0246 10.019 13.0246 9.80528 13.1334C9.61725 13.2291 9.46431 13.3818 9.36834 13.5697C9.25923 13.7833 9.25884 14.063 9.25804 14.6223L9.25002 20.2231C9.25007 20.3422 9.25012 20.4845 9.23988 20.6098C9.22802 20.755 9.19758 20.963 9.08653 21.181C8.94272 21.4632 8.71325 21.6927 8.431 21.8365C8.21306 21.9475 8.00507 21.978 7.85985 21.9899C7.73453 22.0001 7.59228 22 7.47317 22C6.66948 21.9996 5.85651 22.0349 5.05499 21.9694C4.65964 21.9371 4.26643 21.8658 3.88805 21.673C3.32356 21.3854 2.86462 20.9264 2.577 20.362C2.3842 19.9836 2.31289 19.5904 2.28059 19.195C2.24998 18.8204 2.25 18.3657 2.25002 17.8385C2.25002 15.3812 2.2526 12.9239 2.24995 10.4667C2.24943 9.98993 2.24898 9.56992 2.36106 9.1695C2.45942 8.8181 2.62107 8.48759 2.83806 8.19421C3.08532 7.85991 3.41713 7.6024 3.79376 7.31012C6.1072 5.51479 8.42512 3.72458 10.7284 1.91623C10.9954 1.7066 11.33 1.44395 11.7273 1.33636Z"
      fill="#6B57F9"
    />
  </svg>
);

const HedgehogIcon = ({ active }: { active: boolean }) => (
  <img
    src={HedgehogHeadIcon}
    alt="Agents"
    style={{ height: 32, width: 32, filter: active ? "none" : "grayscale(100%)" }}
  />
);

const CurrencyDollarCircleActive = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="25" height="24" viewBox="0 0 25 24" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.25 1C6.17487 1 1.25 5.92487 1.25 12C1.25 18.0751 6.17487 23 12.25 23C18.3251 23 23.25 18.0751 23.25 12C23.25 5.92487 18.3251 1 12.25 1ZM13.25 5.5C13.25 4.94772 12.8023 4.5 12.25 4.5C11.6977 4.5 11.25 4.94772 11.25 5.5V6C9.317 6 7.75 7.567 7.75 9.5C7.75 11.433 9.317 13 11.25 13H13.25C14.0784 13 14.75 13.6716 14.75 14.5C14.75 15.3284 14.0784 16 13.25 16H11.0833C10.347 16 9.75 15.403 9.75 14.6667C9.75 14.1144 9.30229 13.6667 8.75 13.6667C8.19772 13.6667 7.75 14.1144 7.75 14.6667C7.75 16.5076 9.24238 18 11.0833 18H11.25V18.5C11.25 19.0523 11.6977 19.5 12.25 19.5C12.8023 19.5 13.25 19.0523 13.25 18.5V18C15.183 18 16.75 16.433 16.75 14.5C16.75 12.567 15.183 11 13.25 11H11.25C10.4216 11 9.75 10.3284 9.75 9.5C9.75 8.67157 10.4216 8 11.25 8H13.4167C14.153 8 14.75 8.59695 14.75 9.33333C14.75 9.88562 15.1977 10.3333 15.75 10.3333C16.3023 10.3333 16.75 9.88562 16.75 9.33333C16.75 7.49238 15.2576 6 13.4167 6H13.25V5.5Z"
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
    route: "/",
  },
  {
    title: "Agents",
    dictionaryKey: "agents",
    icon: <HedgehogIcon active={false} />,
    iconActive: <HedgehogIcon active={true} />,
    size: "24px",
    route: "/agents",
  },
  {
    title: "Earn",
    dictionaryKey: "earn",
    icon: <CurrencyDollarCircle />,
    iconActive: <CurrencyDollarCircleActive />,
    size: "24px",
    route: "/earn",
  },
  {
    title: "Menu",
    dictionaryKey: "menu",
    icon: <Grid01 />,
    iconActive: <Grid01 color="#6B57F9" fill="#6B57F9" />,
    size: "24px",
    route: "/quick-settings",
  },
] as const;

export const NavigationBar = () => {
  const { data: status } = useAOMintingStatus();
  const hasClaimableBalance = useHasClaimableBalance();
  const { location, navigate } = useLocation();
  const [activeAddress] = useStorage(
    {
      key: "active_address",
      instance: ExtensionStorage,
    },
    "",
  );

  const [isSeedphraseBackedUp = true] = useStorage(
    {
      key: `recovery_phrase_backedup_${activeAddress}`,
      instance: ExtensionStorage,
    },
    true,
  );

  const shouldShowNavigationBar = buttons.some((button) => location === button.route);

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
            data-active={active ? "true" : "false"}
            key={index}
            onClick={() => {
              if (button.route === "/agents") {
                trackEvent(EventType.AGENT_DASHBOARD, {});
              } else if (button.route === "/earn") {
                trackEvent(EventType.EARN_BUTTON, {});
              }

              navigate(button.route as WanderRoutePath);
            }}>
            <IconWrapper size={button.size}>
              {active ? button.iconActive : button.icon}
              {!isSeedphraseBackedUp && button.route === "/quick-settings" && <PendingActionDot />}
              {status === "Paused" && button.route === "/agents" && <PendingActionDot color="#EE5A4F" />}
              {hasClaimableBalance && button.route === "/earn" && <PendingActionDot color="#EEBD41" />}
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
  width: ${IS_EMBEDDED_APP ? "100%" : "377px"};
  display: flex;
  box-sizing: border-box;
`;

const NavigationButton = styled.button<{
  active?: boolean;
}>`
  color: ${(props) => (props.active ? props.theme.primaryText : props.theme.secondaryText)};
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
  transition: transform 0.2s ease;
  position: relative;

  ${NavigationButton}:not([data-active="true"]):hover & {
    transform: scale(1.1);
  }
`;

const PendingActionDot = styled.div<{ color?: string }>`
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background-color: ${(props) => props.color || "#eebd41"};
  border-radius: 50%;
  flex-shrink: 0;
`;
