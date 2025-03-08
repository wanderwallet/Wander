import {
  type DisplayTheme,
  Section,
  Text,
  Spacer
} from "@arconnect/components";
import { Avatar, CloseLayer, NoAvatarIcon } from "./WalletHeader";
import { AnimatePresence, motion } from "framer-motion";
import { hoverEffect, useTheme } from "~utils/theme";
import { useStorage } from "~utils/storage";
import { ArrowLeftIcon } from "@iconicicons/react";
import { ExtensionStorage } from "~utils/storage";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import { useEffect, useMemo, useState } from "react";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import WalletSwitcher from "./WalletSwitcher";
import styled from "styled-components";
import { svgie } from "~utils/svgies";
import { useLocation } from "~wallets/router/router.utils";
import { useNameServiceProfile } from "~lib/nameservice";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";

export default function Head({
  title,
  showOptions = true,
  back: onBack,
  showBack = true,
  allowOpen = true
}: Props) {
  const theme = useTheme();
  const { back } = useLocation();

  // scroll position
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [scrolled, setScrolled] = useState(false);

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

  // first render for animation
  const [firstRender, setFirstRender] = useState(true);

  useEffect(() => setFirstRender(false), []);

  // wallet switcher open
  const [isOpen, setOpen] = useState(false);

  // hardware api type
  const hardwareApi = useHardwareApi();
  const gateway = useGateway(FULL_HISTORY);

  return (
    <HeadWrapper
      displayTheme={theme}
      collapse={scrollDirection === "down"}
      scrolled={scrolled}
    >
      {showBack ? (
        <BackWrapper>
          <BackButton
            onClick={async () => {
              if (onBack) await onBack();
              else back();
            }}
          />
        </BackWrapper>
      ) : (
        <Spacer y={1.6} />
      )}

      <PageInfo
        key={scrollDirection}
        scrollDirection={scrollDirection}
        firstRender={firstRender}
      >
        <PageTitle>{title}</PageTitle>
        <ClickableAvatar
          img={
            nameServiceProfile?.logo
              ? concatGatewayURL(gateway) + "/" + nameServiceProfile.logo
              : svgieAvatar
          }
          onClick={() => {
            if (!allowOpen) return;
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
        </ClickableAvatar>
      </PageInfo>
      {isOpen && <CloseLayer onClick={() => setOpen(false)} />}
      <WalletSwitcher open={isOpen} close={() => setOpen(false)} />
    </HeadWrapper>
  );
}

const HeadWrapper = styled(Section)<{
  collapse: boolean;
  scrolled: boolean;
  displayTheme: DisplayTheme;
}>`
  position: sticky;
  display: flex;
  align-items: ${(props) => (props.collapse ? "center" : "flex-start")};
  flex-direction: ${(props) => (props.collapse ? "row" : "column")};
  gap: ${(props) => (props.collapse ? "0.77rem" : "0.5rem")};
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding-top: 2.15rem;
  padding-bottom: 0.8rem;
  background-color: rgba(${(props) => props.theme.background}, 0.75);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid;
  border-bottom-color: ${(props) =>
    props.scrolled
      ? "rgba(" +
        (props.displayTheme === "light" ? "235, 235, 241" : "31, 30, 47") +
        ")"
      : "transparent"};
  transition: border-color 0.23s ease-in-out;
`;

const BackWrapper = styled.div`
  position: relative;
  display: flex;
  width: max-content;
  height: max-content;
  cursor: pointer;

  ${hoverEffect}

  &::after {
    width: 158%;
    height: 158%;
    border-radius: 100%;
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const BackButton = styled(ArrowLeftIcon)`
  font-size: 1.6rem;
  width: 1em;
  height: 1em;
  color: ${(props) => props.theme.primaryText};
  z-index: 2;

  path {
    stroke-width: 1.75 !important;
  }
`;

const PageInfo = styled(motion.div).attrs<{
  scrollDirection: "up" | "down";
  firstRender: boolean;
}>((props) => ({
  initial: !props.firstRender
    ? { opacity: 0, y: props.scrollDirection === "up" ? 20 : -20 }
    : undefined,
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: props.scrollDirection === "up" ? -20 : 20 }
}))<{
  firstRender: boolean;
  scrollDirection: "up" | "down";
}>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const PageTitle = styled(Text).attrs({
  subtitle: true,
  noMargin: true
})`
  font-size: 1.5rem;
  font-weight: 500;
`;

const ClickableAvatar = styled(Avatar)`
  cursor: pointer;
  width: 2.1rem;
  height: 2.1rem;

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }

  ${NoAvatarIcon} {
    font-size: 1.4rem;
  }
`;

interface Props {
  title: string;
  showOptions?: boolean;
  // allow opening the wallet switcher
  showBack?: boolean;
  allowOpen?: boolean;
  back?: (...args) => any;
}
