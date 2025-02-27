import { type MouseEventHandler, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import HardwareWalletIcon, {
  hwIconAnimateProps
} from "~components/hardware/HardwareWalletIcon";
import { useHardwareApi } from "~wallets/hooks";
import type { StoredWallet } from "~wallets";
import { formatAddress, getAppURL, truncateMiddle } from "~utils/format";
import { removeApp } from "~applications";
import { useAnsProfile } from "~lib/ans";
import { useTheme } from "~utils/theme";
import {
  Button,
  Card,
  type DisplayTheme,
  Text,
  useToasts,
  Tooltip
} from "@arconnect/components-rebrand";
import {
  CheckIcon,
  CopyIcon,
  GlobeIcon,
  LogOutIcon,
  SettingsIcon,
  MinimizeIcon,
  UserIcon
} from "@iconicicons/react";
import WalletSwitcher, { popoverAnimation } from "./WalletSwitcher";
import Application, { type AppInfo } from "~applications/application";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import useActiveTab from "~applications/useActiveTab";
import AppIcon, { NoAppIcon } from "./home/AppIcon";
import Squircle from "~components/Squircle";
import browser from "webextension-polyfill";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import { type Gateway } from "~gateways/gateway";
import { Bell03 } from "@untitled-ui/icons-react";
import { svgie } from "~utils/svgies";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";

export default function WalletHeader() {
  const theme = useTheme();
  const { navigate } = useLocation();

  // current address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // all wallets added
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  // is the wallet selector open
  const [isOpen, setOpen] = useState(false);

  // toasts
  const { setToast } = useToasts();

  // copy current address
  const copyAddress: MouseEventHandler = (e) => {
    e.stopPropagation();
    copy(activeAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    setToast({
      type: "success",
      duration: 2000,
      content: browser.i18n.getMessage("copied_address", [
        walletName,
        formatAddress(activeAddress, 3)
      ])
    });
  };

  // profile picture
  const ansProfile = useAnsProfile(activeAddress);

  // fallback svgie for profile picture
  const svgieAvatar = useMemo(
    () => svgie(activeAddress, { asDataURI: true }),
    [activeAddress]
  );

  // wallet nickname for copy
  const [displayName, setDisplayName] = useState("");

  // wallet address for copy
  const [address, setAddress] = useState("");

  // wallet name
  const walletName = useMemo(() => {
    if (!ansProfile?.label) {
      const wallet = wallets.find(({ address }) => address === activeAddress);
      let name = wallet?.nickname || "Wallet";

      const address = wallet?.address && formatAddress(wallet?.address, 4);
      setAddress(address);
      setDisplayName(name);

      return wallet?.nickname || "Wallet";
    }

    return ansProfile.label;
  }, [wallets, ansProfile, activeAddress]);

  // hardware wallet type
  const hardwareApi = useHardwareApi();

  // has notifications
  const [newNotifications, setNewNotifications] = useStorage<boolean>(
    {
      key: "new_notifications",
      instance: ExtensionStorage
    },
    false
  );

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const listener = () => setScrollY(window.scrollY);

    window.addEventListener("scroll", listener);

    return () => window.removeEventListener("scroll", listener);
  }, []);

  // app info open
  const [appDataOpen, setAppDataOpen] = useState(false);

  // active app
  const activeTab = useActiveTab();
  const activeApp = useMemo<Application | undefined>(() => {
    if (!activeTab?.url) {
      return undefined;
    }

    return new Application(getAppURL(activeTab.url));
  }, [activeTab]);

  // active app data
  const [activeAppData, setActiveAppData] = useState<
    AppInfo & { gateway: Gateway }
  >();

  useEffect(() => {
    (async () => {
      // check if there is an active app
      if (!activeApp) {
        return setActiveAppData(undefined);
      }

      // check if connected
      const connected = await activeApp.isConnected();
      if (!connected) {
        return setActiveAppData(undefined);
      }

      // get app data
      const appData = await activeApp.getAppData();
      const gatewayConfig = await activeApp.getGatewayConfig();

      setActiveAppData({
        ...appData,
        gateway: gatewayConfig
      });
    })();
  }, [activeApp]);

  // copied address
  const [copied, setCopied] = useState(false);

  const isEmbedded = import.meta.env?.VITE_IS_EMBEDDED_APP === "1";

  return (
    <Wrapper displayTheme={theme} scrolled={scrollY > 14}>
      <AppAction
        onClick={(e) => {
          e.stopPropagation();
          setAppDataOpen(true);
        }}
      >
        <Tooltip
          content={browser.i18n.getMessage(
            !activeAppData ? "disconnected" : "account_connected"
          )}
          position="bottomStart"
        >
          <Action as={GlobeIcon} style={{ width: "30px", height: "30px" }} />
        </Tooltip>
        <AppOnline online={!!activeAppData} />
      </AppAction>

      <AddressContainer>
        <Wallet
          onClick={() => {
            if (!isOpen) setOpen(true);
          }}
        >
          <Avatar img={ansProfile?.avatar || svgieAvatar}>
            {!ansProfile?.avatar && !svgieAvatar && <NoAvatarIcon />}
            <AnimatePresence initial={false}>
              {hardwareApi === "keystone" && (
                <HardwareWalletIcon
                  icon={keystoneLogo}
                  color="#2161FF"
                  {...hwIconAnimateProps}
                />
              )}
            </AnimatePresence>
          </Avatar>

          <WalletName>
            <Text weight="medium" noMargin>
              {truncateMiddle(displayName, 10)}
            </Text>
            <Address>{address}</Address>
          </WalletName>
        </Wallet>
        <Tooltip
          content={browser.i18n.getMessage("copy_address")}
          position="bottom"
        >
          <Action
            as={copied ? CheckIcon : CopyIcon}
            onClick={copyAddress}
            active={copied}
            style={{ width: "24px", height: "24px" }}
          />
        </Tooltip>
      </AddressContainer>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Tooltip
          content={browser.i18n.getMessage("setting_notifications")}
          position="bottomEnd"
        >
          <Action
            as={Bell03}
            onClick={() => {
              setNewNotifications(false);
              navigate("/notifications");
            }}
            style={{ width: "24px", height: "24px" }}
          />
          {newNotifications && <Notifier />}
        </Tooltip>
        {isEmbedded && (
          <Tooltip
            content={browser.i18n.getMessage("close")}
            position="bottomEnd"
          >
            <Action
              as={MinimizeIcon}
              onClick={() => {
                postEmbeddedMessage({
                  type: "embedded_close",
                  data: null
                });
              }}
              style={{ width: "24px", height: "24px" }}
            />
          </Tooltip>
        )}
      </div>

      {appDataOpen && (
        <CloseLayer
          key="WalletHeaderCloseLayer"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(false);
            setAppDataOpen(false);
          }}
        />
      )}

      <WalletSwitcher open={isOpen} close={() => setOpen(false)} />

      <AnimatePresence>
        {appDataOpen && (
          <AppInfoWrapper
            variants={popoverAnimation}
            onClick={(e) => e.stopPropagation()}
          >
            <Card>
              <AppInfo>
                {(!!activeAppData && (
                  <Tooltip
                    content={
                      browser.i18n.getMessage("gateway") +
                      ": " +
                      activeAppData.gateway.host
                    }
                    position="topStart"
                  >
                    <ActiveAppIcon connected>
                      {(activeAppData?.logo && (
                        <img
                          src={activeAppData.logo}
                          alt={activeAppData.name || ""}
                          draggable={false}
                        />
                      )) || <NoAppIcon />}
                      <AppOnline online={!!activeAppData} />
                    </ActiveAppIcon>
                  </Tooltip>
                )) || (
                  <ActiveAppIcon connected={false}>
                    <NoAppIcon />
                  </ActiveAppIcon>
                )}
                <div>
                  <AppName>
                    {activeAppData?.name ||
                      browser.i18n.getMessage(
                        activeAppData ? "appConnected" : "not_connected"
                      )}
                  </AppName>
                  <AppUrl>{getAppURL(activeTab?.url)}</AppUrl>
                </div>
              </AppInfo>
              <AppOptions>
                {(!activeAppData && (
                  <NotConnectedNote>
                    {browser.i18n.getMessage("not_connected_text")}
                  </NotConnectedNote>
                )) || (
                  <>
                    <AppActionButtons>
                      <Button
                        fullWidth
                        variant="secondary"
                        onClick={() =>
                          browser.tabs.create({
                            url: browser.runtime.getURL(
                              `tabs/dashboard.html#/apps/${activeApp.url}`
                            )
                          })
                        }
                      >
                        <SettingsIcon style={{ marginRight: "5px" }} />
                        {browser.i18n.getMessage("settings")}
                      </Button>
                      <Button
                        fullWidth
                        onClick={async () => {
                          await removeApp(getAppURL(activeTab?.url));
                          setActiveAppData(undefined);
                          setAppDataOpen(false);
                        }}
                      >
                        <LogOutIcon
                          style={{
                            position: "absolute",
                            right: "120px",
                            width: "24px",
                            height: "24px",
                            marginRight: "5px"
                          }}
                        />
                        <div style={{ marginLeft: "24px" }}>
                          {browser.i18n.getMessage("disconnect")}
                        </div>
                      </Button>
                    </AppActionButtons>
                  </>
                )}
              </AppOptions>
            </Card>
          </AppInfoWrapper>
        )}
      </AnimatePresence>
    </Wrapper>
  );
}

const Wrapper = styled.nav<{
  displayTheme: DisplayTheme;
  scrolled: boolean;
}>`
  position: sticky;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  background-color: rgba(${(props) => props.theme.background}, 0.75);
  backdrop-filter: blur(15px);
  transition: border 0.23s ease-in-out;
  user-select: none;
  padding: 24px;
`;

const WalletName = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 4px;
  border-radius: 0.5rem;
  background: ${(props) => props.theme.surfaceSecondary};
`;

const AddressContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const Wallet = styled.div`
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.06s ease-in-out, background-color 0.17s ease-in-out;

  p {
    color: ${(props) => props.theme.primaryText};
  }

  ${HardwareWalletIcon} {
    width: 16px;
    height: 16px;
  }

  &:hover {
    background-color: rgba(${(props) => props.theme.theme}, 0.1);
  }

  &:active {
    background-color: rgba(${(props) => props.theme.theme}, 0.15);
    transform: scale(0.96);
  }
`;

const Address = styled(Text).attrs({
  variant: "secondary",
  weight: "medium",
  noMargin: true
})`
  @media (max-width: 375px) {
    display: none;
  }
`;

const avatarSize = "1.5rem";

export const Avatar = styled(Squircle)`
  position: relative;
  width: ${avatarSize};
  height: ${avatarSize};

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }
`;

export const NoAvatarIcon = styled(UserIcon)`
  position: absolute;
  font-size: 1rem;
  width: 1em;
  height: 1em;
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

const Notifier = styled.div`
  position: absolute;
  right: 1.3px;
  top: 0.7px;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: ${(props) => props.theme.fail};
  border: 1px solid rgb(${(props) => props.theme.background});
`;

const AppOnline = styled.div<{ online: boolean }>`
  position: absolute;
  right: 3px;
  bottom: 2px;
  width: 8px;
  height: 8px;
  border-radius: 100%;
  background-color: ${(props) =>
    props.online ? props.theme.success : "rgb(154, 154, 167)"};
  border: 1px solid rgb(${(props) => props.theme.background});
`;

const AppAction = styled.div`
  position: relative;
  display: flex;
`;

export const Action = styled(CopyIcon)<{ active?: boolean }>`
  cursor: pointer;
  font-size: 1.25rem;
  width: 1.5em;
  height: 1.5em;
  color: ${(props) =>
    props.active ? props.theme.success : props.theme.primaryText};
  transition: all 0.23s ease-in-out;

  &:hover {
    opacity: 0.85;
  }

  &:active {
    transform: scale(0.92);
  }
`;

const AppInfoWrapper = styled(motion.div).attrs({
  initial: "closed",
  animate: "open",
  exit: "closed"
})`
  position: absolute;
  top: 100%;
  right: 15px;
  z-index: 110;
  width: calc(100% - 30px);
  cursor: default;

  ${Card} {
    padding: 0;
    width: 100%;
  }
`;

const AppInfo = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  gap: 10px;
  border-bottom: 1px solid rgb(${(props) => props.theme.cardBorder});
`;

const AppOptions = styled.div`
  padding: 10px;
`;

const AppActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 0.6rem;
`;

const NotConnectedNote = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.84rem;
  text-align: justify;
`;

const ActiveAppIcon = styled(AppIcon)<{ connected: boolean }>`
  position: relative;
  width: 2rem;
  height: 2rem;
  color: rgb(
    ${(props) =>
      props.connected ? props.theme.theme : props.theme.secondaryText}
  );

  ${AppOnline} {
    width: 10px;
    height: 10px;
    border-width: 1.5px;
    right: -2.5px;
    bottom: -2.5px;
  }

  ${NoAppIcon} {
    font-size: 1rem;
  }

  img {
    max-width: 1.5em;
  }
`;

const AppName = styled(Text).attrs({
  noMargin: true
})`
  color: ${(props) => props.theme.primaryText};
  line-height: 1.1em;
`;

const AppUrl = styled(Text).attrs({
  noMargin: true
})`
  font-size: 0.75rem;
  line-height: 1.1em;
`;

export const CloseLayer = styled(motion.div)`
  position: fixed;
  z-index: 100;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  cursor: default;
  background-color: ${({ theme }) =>
    `rgba(0, 0, 0, ${theme.displayTheme === "light" ? 0.3 : 0.7})`};
`;
