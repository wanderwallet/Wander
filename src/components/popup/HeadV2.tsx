import {
  type DisplayTheme,
  Section,
  Text,
  Tooltip
} from "@arconnect/components-rebrand";
import { Avatar, CloseLayer, NoAvatarIcon } from "./WalletHeader";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "~utils/theme";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import React, { useEffect, useMemo, useState } from "react";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import WalletSwitcher from "./WalletSwitcher";
import styled from "styled-components";
import { svgie } from "~utils/svgies";
import type { AppLogoInfo } from "~applications/application";
import Squircle from "~components/Squircle";
import { useLocation } from "~wallets/router/router.utils";
import { ArrowNarrowLeft } from "@untitled-ui/icons-react";
import { useNameServiceProfile } from "~lib/nameservice";
import { concatGatewayURL } from "~gateways/utils";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";

export interface HeadV2Props {
  title: string;
  showOptions?: boolean;
  // allow opening the wallet switcher
  showBack?: boolean;
  padding?: string;
  back?: (...args) => any;
  appInfo?: AppLogoInfo;
  onAppInfoClick?: () => void;
}

export default function HeadV2({
  title,
  showOptions = true,
  back: onBack,
  padding,
  showBack = true,
  appInfo,
  onAppInfoClick
}: HeadV2Props) {
  const theme = useTheme();
  const { back } = useLocation();

  // scroll position
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [scrolled, setScrolled] = useState(false);

  // TODO: figure out if this will still be used
  useEffect(() => {
    const listener = () => {
      const isScrolled = window.scrollY > 0;
      const newDir = isScrolled ? "down" : "up";

      // don't set it again
      if (newDir === scrollDirection) return;
      if (scrolled !== isScrolled) {
        setScrolled(isScrolled);
      }

      // if the difference between the scroll height
      // and the client height if not enough
      // don't let the scroll direction change
      const diff =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

      if (diff < 85) return;

      setScrollDirection(newDir);
    };

    window.addEventListener("scroll", listener);

    return () => window.removeEventListener("scroll", listener);
  }, [scrollDirection]);

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const nameServiceProfile = useNameServiceProfile(activeAddress);

  const svgieAvatar = useMemo(
    () => svgie(activeAddress, { asDataURI: true }),
    [activeAddress]
  );

  // wallet switcher open
  const [isOpen, setOpen] = useState(false);

  // hardware api type
  const hardwareApi = useHardwareApi();

  const appName = appInfo?.name;
  const appIconPlaceholderText = appInfo?.placeholder;

  const SquircleWrapper = onAppInfoClick ? ButtonSquircle : React.Fragment;
  const gateway = useGateway(FULL_HISTORY);

  return (
    <HeadWrapper
      displayTheme={theme}
      collapse={scrollDirection === "down"}
      scrolled={scrolled}
      padding={padding}
      center={appName === undefined}
      hasBackButton={showBack}
    >
      {showBack ? (
        <BackButton
          onClick={async () => {
            if (onBack) await onBack();
            else back();
          }}
        >
          <BackButtonIcon />
        </BackButton>
      ) : null}

      <PageTitle showLeftMargin={showBack && !showOptions && !!appName}>
        {title}
      </PageTitle>

      {!showOptions && appName ? (
        <Tooltip content={appName} position="bottomEnd">
          <SquircleWrapper>
            <SquircleImg
              img={appInfo?.logo}
              placeholderText={appIconPlaceholderText}
              onClick={onAppInfoClick}
            />
          </SquircleWrapper>
        </Tooltip>
      ) : null}

      {showOptions ? (
        <>
          <AvatarButton>
            <ButtonAvatar
              img={
                nameServiceProfile?.logo
                  ? concatGatewayURL(gateway) + "/" + nameServiceProfile.logo
                  : svgieAvatar
              }
              onClick={() => {
                setOpen(true);
              }}
            >
              {!nameServiceProfile?.logo && !svgieAvatar && <NoAvatarIcon />}
              <AnimatePresence initial={false}>
                {hardwareApi === "keystone" && (
                  <HardwareWalletIcon
                    icon={keystoneLogo}
                    color="#2161FF"
                    {...hwIconAnimateProps}
                  />
                )}
              </AnimatePresence>
            </ButtonAvatar>
          </AvatarButton>

          <WalletSwitcher open={isOpen} close={() => setOpen(false)} />

          {isOpen && <CloseLayer onClick={() => setOpen(false)} />}
        </>
      ) : null}
    </HeadWrapper>
  );
}

const HeadWrapper = styled(Section)<{
  collapse: boolean;
  scrolled: boolean;
  displayTheme: DisplayTheme;
  padding: string;
  center: boolean;
  hasBackButton: boolean;
}>`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 21;
  display: flex;
  flex-direction: row;
  width: full;
  transition: padding 0.07s ease-in-out, border-color 0.23s ease-in-out;
  padding: ${(props) => (props.padding ? props.padding : "24px")};
  justify-content: ${(props) => (props.center ? "center" : "space-between")};
  align-items: center;
  background-color: rgba(${(props) => props.theme.background}, 0.75);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid;
  border-bottom-color: ${(props) =>
    props.scrolled
      ? "rgba(" +
        (props.displayTheme === "light" ? "235, 235, 241" : "31, 30, 47") +
        ")"
      : "transparent"};
  user-select: none;
`;

const BackButton = styled.button`
  position: absolute;
  width: 24px;
  height: 24px;
  top: 50%;
  left: 24px;
  transform: translate(0, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: transparent;
  border: 0;

  &::before {
    content: "";
    position: absolute;
    inset -15px 0;
  }

  & svg {
    transition: transform 0.07s ease-in-out;
  }

  &:hover svg {
    transform: scale(1.08);
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const BackButtonIcon = styled(ArrowNarrowLeft)`
  font-size: 1rem;
  width: 1.5em;
  height: 1.5em;
  color: ${(props) => props.theme.primaryText};
  z-index: 2;

  path {
    stroke-width: 2 !important;
  }
`;

const PageTitle = styled(Text).attrs({
  noMargin: true
})<{ showLeftMargin: boolean }>`
  font-size: 1.375rem;
  font-weight: 500;
  ${(props) => props.showLeftMargin && `margin-left: 28px;`}
`;

const AvatarButton = styled.button`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  cursor: pointer;
  padding: 0 24px;
  height: 100%;
  background: transparent;
  border: 0;
`;

const ButtonAvatar = styled(Avatar)`
  width: 2.1rem;
  height: 2.1rem;

  & svg {
    transition: transform 0.07s ease-in-out;
  }

  &:active svg {
    transform: scale(0.93);
  }

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }

  ${NoAvatarIcon} {
    font-size: 1.4rem;
  }
`;

const ButtonSquircle = styled.button`
  position: relative;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    inset -15px;
  }

  & svg {
    transition: transform 0.07s ease-in-out;
  }

  &:hover svg {
    transform: scale(1.08);
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const SquircleImg = styled(Squircle)`
  width: 28px;
  height: 28px;
`;
