import {
  Input,
  Section,
  Spacer,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import {
  permissionData,
  signPolicyOptions,
  type PermissionType
} from "~applications/permissions";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { AnimatePresence, motion } from "framer-motion";
import { unlock as globalUnlock } from "~wallets/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { formatAddress } from "~utils/format";
import { addApp } from "~applications";
import WalletSwitcher from "~components/popup/WalletSwitcher";
import Wrapper from "~components/auth/Wrapper";
import browser from "webextension-polyfill";
import Label from "~components/auth/Label";
import App from "~components/auth/App";
import styled, { useTheme, type DefaultTheme } from "styled-components";
import { EventType, trackEvent } from "~utils/analytics";
import Application, { type SignPolicy } from "~applications/application";
import { defaultGateway } from "~gateways/gateway";
import Permissions from "../../components/auth/Permissions";
import { HeadAuth } from "~components/HeadAuth";
import { AuthButtons } from "~components/auth/AuthButtons";
import Squircle from "~components/Squircle";
import { useActiveWallet, useAskPassword } from "~wallets/hooks";
import Checkbox from "~components/Checkbox";
import { ChevronRight, Edit02, InfoCircle } from "@untitled-ui/icons-react";
import WanderIcon from "url:assets/icon.svg";
import Image from "~components/common/Image";
import { Flex } from "~components/common/Flex";
import { svgie } from "~utils/svgies";
import { useNameServiceProfile } from "~lib/nameservice";
import { FULL_HISTORY, useGateway } from "~gateways/wayfinder";
import { concatGatewayURL } from "~gateways/utils";

type Page = "unlock" | "connect" | "permissions" | "confirm";

const PAGES_WITH_BACKGROUND = new Set(["connect", "unlock"]);

export function ConnectAuthRequestView() {
  const theme = useTheme();

  // active address
  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const [signPolicy, setSignPolicy] = useState<SignPolicy>("always_ask");

  const askPassword = useAskPassword();

  // permissions to add
  const [permissions, setPermissions] = useState<PermissionType[]>([]);

  const wallet = useActiveWallet();

  const [avatar, setAvatar] = useState("");

  const nameServiceProfile = useNameServiceProfile(wallet?.address);
  const nsGateway = useGateway(FULL_HISTORY);

  useEffect(() => {
    if (!wallet?.address) return;

    if (nameServiceProfile?.logo && nsGateway?.protocol && nsGateway?.host) {
      setAvatar(concatGatewayURL(nsGateway) + "/" + nameServiceProfile.logo);
    } else {
      setAvatar(svgie(wallet?.address, { asDataURI: true }));
    }
  }, [wallet, nameServiceProfile, nsGateway]);

  const { authRequest, acceptRequest, rejectRequest } =
    useCurrentAuthRequest("connect");

  const {
    url = "",
    permissions: authRequestPermissions = [],
    appInfo = {},
    gateway
  } = authRequest;

  // wallet switcher open
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // page
  const [page, setPage] = useState<Page>("connect");

  // password input
  const passwordInput = useInput();

  // toasts
  const { setToast } = useToasts();

  // requested permissions
  const [requestedPermissions, setRequestedPermissions] = useState<
    PermissionType[]
  >([]);

  const [requestedPermCopy, setRequestedPermCopy] = useState<PermissionType[]>(
    []
  );

  const withBackground = useMemo(() => {
    return PAGES_WITH_BACKGROUND.has(page);
  }, [page]);

  const isCustomPermissions = useMemo(() => {
    if (requestedPermissions.length !== requestedPermCopy.length) return true;

    // Create sorted copies to ensure order doesn't matter
    const sortedRequested = [...requestedPermissions].sort();
    const sortedInitial = [...requestedPermCopy].sort();

    // Compare each element
    return sortedRequested.some(
      (permission, index) => permission !== sortedInitial[index]
    );
  }, [requestedPermissions, requestedPermCopy]);

  // connect
  const connect = useCallback(
    async (checkPassword = true) => {
      if (!url) return;

      if (checkPassword) {
        const unlockRes = await globalUnlock(passwordInput.state);

        if (!unlockRes) {
          passwordInput.setStatus("error");
          return setToast({
            type: "error",
            content: browser.i18n.getMessage("invalidPassword"),
            duration: 2200
          });
        }
      }

      // get existing permissions
      const app = new Application(url);
      const isAppPresent = await app.isAppPresent();

      if (!isAppPresent) {
        // add the app
        await addApp({
          url,
          permissions,
          name: appInfo.name,
          logo: appInfo.logo,
          signPolicy,
          // alwaysAsk,
          allowance: {
            enabled: false,
            limit: "0",
            spent: "0" // in winstons
          },
          // TODO: wayfinder
          gateway: gateway || defaultGateway
        });
      } else {
        // update existing permissions, if the app
        // has already been added

        await app.updateSettings({
          signPolicy,
          permissions,
          // alwaysAsk,
          allowance: {
            enabled: false,
            limit: "0",
            spent: "0" // in winstons
          }
        });
      }

      // track connected app.
      await trackEvent(EventType.CONNECTED_APP, {
        appName: appInfo.name,
        appUrl: url
      });

      acceptRequest();
    },
    [
      url,
      passwordInput.state,
      permissions,
      appInfo,
      signPolicy,
      gateway,
      acceptRequest
    ]
  );

  const handleBack = useCallback(async () => {
    if (page === "confirm") {
      setPage("connect");
    } else if (page === "permissions") {
      setPage("confirm");
    }
  }, [page]);

  const handlePrimaryOnClick = useCallback(async () => {
    if (page === "connect") {
      setPage("confirm");
    } else if (page === "confirm") {
      if (!askPassword) {
        return connect(false);
      } else {
        setPage("unlock");
      }
    } else if (page === "unlock") {
      await connect();
    }
  }, [page, askPassword, connect]);

  useEffect(() => {
    (async () => {
      const requested: PermissionType[] = authRequestPermissions;

      // add existing permissions
      if (url) {
        const app = new Application(url);
        const existing = await app.getPermissions();

        for (const existingP of existing) {
          if (requested.includes(existingP)) continue;
          requested.push(existingP);
        }
      }

      setRequestedPermissions(
        requested.filter((p) => Object.keys(permissionData).includes(p))
      );

      setRequestedPermCopy(
        requested.filter((p) => Object.keys(permissionData).includes(p))
      );
    })();
  }, [url, authRequestPermissions]);

  useEffect(() => setPermissions(requestedPermissions), [requestedPermissions]);

  return (
    <Wrapper withBackground={withBackground}>
      <>
        <HeadAuth
          showHead={!PAGES_WITH_BACKGROUND.has(page)}
          title={browser.i18n.getMessage(page)}
          back={handleBack}
          appInfo={appInfo}
        />

        {!PAGES_WITH_BACKGROUND.has(page) && (
          <App
            appName={appInfo.name || url}
            appUrl={url}
            showTitle={false}
            // TODO: wayfinder
            gateway={gateway || defaultGateway}
            appIcon={appInfo.logo}
          />
        )}

        <ContentWrapper style={{ flex: 1 }}>
          <AnimatePresence initial={false}>
            {page === "connect" && (
              <ConnectPage
                appInfo={appInfo}
                url={url}
                gateway={gateway}
                wallet={wallet}
                avatar={avatar}
                activeAddress={activeAddress}
                switcherOpen={switcherOpen}
                setSwitcherOpen={setSwitcherOpen}
              />
            )}
            {page === "confirm" && (
              <ConfirmPage
                appInfo={appInfo}
                url={url}
                signPolicy={signPolicy}
                setSignPolicy={setSignPolicy}
                isCustomPermissions={isCustomPermissions}
                setPage={setPage}
                theme={theme}
              />
            )}
            {page === "unlock" && (
              <UnlockPage
                appInfo={appInfo}
                gateway={gateway}
                passwordBindings={passwordInput.bindings}
                connect={connect}
              />
            )}
            {page === "permissions" && (
              <PermissionsPage
                authRequest={authRequest}
                requestedPermissions={requestedPermissions}
                setRequestedPermissions={setRequestedPermissions}
                setPage={setPage}
              />
            )}
          </AnimatePresence>
        </ContentWrapper>
      </>

      {page !== "permissions" && (
        <Section>
          <AuthButtons
            authRequest={authRequest}
            primaryButtonProps={{
              label: browser.i18n.getMessage(
                page === "unlock" || (page === "confirm" && !askPassword)
                  ? "connect"
                  : page !== "confirm"
                  ? "next"
                  : "confirm"
              ),
              onClick: handlePrimaryOnClick
            }}
            secondaryButtonProps={{
              label: browser.i18n.getMessage("cancel"),
              onClick: () => rejectRequest()
            }}
          />
        </Section>
      )}
    </Wrapper>
  );
}

const UnlockPage = ({
  appInfo,
  gateway,
  passwordBindings,
  connect
}: {
  appInfo: any;
  gateway: any;
  passwordBindings: any;
  connect: () => Promise<void>;
}) => (
  <UnlockWrapper>
    <Section style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
      <div
        style={{
          textAlign: "center",
          height: "200px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end"
        }}
      >
        <AppIconsWrapper>
          <IconWrapper src={appInfo.logo} alt={appInfo.name} />
          <IconWrapper
            backgroundColor="#EBE0FF"
            src={WanderIcon}
            style={{ marginLeft: "-4px" }}
            alt="Wander Icon"
          />
        </AppIconsWrapper>
        <Spacer y={1} />
        <div style={{ textAlign: "center", gap: 4 }}>
          <ConnectToApp>
            {browser.i18n.getMessage("enter_your_password")}
          </ConnectToApp>
          <Gateway>
            {browser.i18n.getMessage("gateway")}:{" "}
            {(gateway || defaultGateway)?.host || ""}
          </Gateway>
        </div>
      </div>
      <Input
        type="password"
        placeholder={browser.i18n.getMessage("enter_your_password")}
        fullWidth
        {...passwordBindings}
        autoFocus
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          connect();
        }}
      />
    </Section>
  </UnlockWrapper>
);

const PermissionsPage = ({
  authRequest,
  requestedPermissions,
  setRequestedPermissions,
  setPage
}: {
  authRequest: any;
  requestedPermissions: PermissionType[];
  setRequestedPermissions: (perms: PermissionType[]) => void;
  setPage: (page: Page) => void;
}) => (
  <Permissions
    connectAuthRequest={authRequest}
    requestedPermissions={requestedPermissions}
    update={setRequestedPermissions}
    closeEdit={() => setPage("confirm")}
  />
);

const ConnectPage = ({
  appInfo,
  url,
  gateway,
  wallet,
  avatar,
  activeAddress,
  switcherOpen,
  setSwitcherOpen
}: {
  appInfo: any;
  url: string;
  gateway: any;
  wallet: any;
  avatar: any;
  activeAddress: string;
  switcherOpen: boolean;
  setSwitcherOpen: (open: boolean) => void;
}) => (
  <ConnectPageContent>
    <ConnectPageSection>
      <ConnectPageSectionHeader>
        <AppIconsWrapper>
          <IconWrapper src={appInfo.logo} alt={appInfo.name} />
          <IconWrapper
            backgroundColor="#EBE0FF"
            src={WanderIcon}
            style={{ marginLeft: "-4px" }}
            alt="Wander Icon"
          />
        </AppIconsWrapper>
        <Spacer y={1} />
        <Flex direction="column" gap={4} justify="center">
          <ConnectToApp>
            {browser.i18n.getMessage("connect_to_app", [appInfo.name || url])}
          </ConnectToApp>
          <Gateway>
            {browser.i18n.getMessage("gateway")}:{" "}
            {(gateway || defaultGateway)?.host || ""}
          </Gateway>
        </Flex>
      </ConnectPageSectionHeader>
      <div>
        <SecondaryText fontSize={16}>
          {browser.i18n.getMessage("select_account", [appInfo.name || url])}:
        </SecondaryText>
        <Spacer y={0.5} />
        <ConnectWalletWrapper onClick={() => setSwitcherOpen(true)}>
          <div style={{ display: "flex", flexDirection: "row", gap: "12px" }}>
            {avatar ? (
              <Avatar img={avatar} />
            ) : (
              <AccountSquircle>
                <AccountInitial>
                  {wallet?.nickname?.charAt(0) || "A"}
                </AccountInitial>
              </AccountSquircle>
            )}
            <div>
              <WalletName>{wallet?.nickname}</WalletName>
              <SecondaryText>
                {formatAddress(activeAddress || "", 4)}
              </SecondaryText>
            </div>
          </div>
          <ChangeText>{browser.i18n.getMessage("change")}</ChangeText>
          <WalletSwitcher
            open={switcherOpen}
            close={() => setSwitcherOpen(false)}
          />
        </ConnectWalletWrapper>
      </div>
    </ConnectPageSection>
  </ConnectPageContent>
);

const ConfirmPage = ({
  appInfo,
  url,
  signPolicy,
  setSignPolicy,
  isCustomPermissions,
  setPage,
  theme
}: {
  appInfo: any;
  url: string;
  signPolicy: SignPolicy;
  setSignPolicy: (policy: SignPolicy) => void;
  isCustomPermissions: boolean;
  setPage: (page: Page) => void;
  theme: DefaultTheme;
}) => (
  <ConnectPageContent>
    <Section
      showPaddingVertical={false}
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      <div style={{ textAlign: "center" }}>
        <PrimaryText fontSize={20} fontWeight={600}>
          {browser.i18n.getMessage("confirm_permissions", [
            appInfo.name || url
          ])}
        </PrimaryText>
        <SecondaryText>{url}</SecondaryText>
      </div>
      <PolicyOptionContainer>
        {signPolicyOptions.map((option) => (
          <PolicyOption key={option} onClick={() => setSignPolicy(option)}>
            <Checkbox
              size={20}
              onChange={() => setSignPolicy(option)}
              checked={signPolicy === option}
            />
            <div>
              <PrimaryText fontSize={16}>
                {browser.i18n.getMessage(option)}
              </PrimaryText>
            </div>
          </PolicyOption>
        ))}
      </PolicyOptionContainer>
      <CustomPermissionsButton onClick={() => setPage("permissions")}>
        <PrimaryText fontSize={16}>
          {browser.i18n.getMessage(
            isCustomPermissions
              ? "custom_permissions_set"
              : "set_custom_permissions"
          )}
        </PrimaryText>
        {isCustomPermissions ? (
          <Edit02 height={24} width={24} color={theme.tertiaryText} />
        ) : (
          <ChevronRight height={24} width={24} color={theme.tertiaryText} />
        )}
      </CustomPermissionsButton>
      <CustomPermissionsInfo>
        <div>
          <InfoCircle height={24} width={24} color={theme.secondaryText} />
        </div>
        <SecondaryText fontSize={14}>
          {browser.i18n.getMessage(`${signPolicy}_description`)}
        </SecondaryText>
      </CustomPermissionsInfo>
    </Section>
  </ConnectPageContent>
);

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  width: max-content;
`;

const UnlockWrapper = styled(motion.div).attrs({
  exit: { opacity: 0 },
  transition: {
    type: "easeInOut",
    duration: 0.2
  }
})`
  width: 100vw;

  ${Label} {
    font-weight: 500;
  }
`;

const IconWrapper = styled(Image).attrs((props) => ({
  height: 48,
  width: 48,
  borderRadius: 48,
  objectFit: "contain",
  backgroundColor: props.backgroundColor || "#fffefc"
}))``;

const AppIconsWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ConnectPageContent = styled.div`
  width: 100vw;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ConnectToApp = styled(Text).attrs({
  noMargin: true
})`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.primaryText};
  line-height: 130%;
`;

const Gateway = styled(Text).attrs({
  noMargin: true
})`
  color: ${(props) => props.theme.secondaryText};
  font-size: 14px;
  font-weight: 500;
  line-height: 150%;
`;

const ConnectWalletWrapper = styled.div`
  display: flex;
  padding: 12px;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  border-radius: 10px;
  background: ${(props) => props.theme.surfaceTertiary};
  cursor: pointer;
`;

const Avatar = styled(Squircle)`
  position: relative;
  width: 2.375rem;
  height: 2.375rem;
  cursor: pointer;
`;

export const AccountSquircle = styled(Squircle)`
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  justify-content: center;
  align-items: center;
  color: rgba(${(props) => props.theme.theme});
`;

export const AccountInitial = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  text-align: center;
  font-size: 20px;
  font-style: normal;
  font-weight: 600;
  line-height: normal;
`;

const WalletName = styled(Text).attrs({
  noMargin: true
})`
  font-size: 18px;
  font-weight: 500;
  color: ${(props) => props.theme.primaryText};
`;

const SecondaryText = styled(Text).attrs({
  noMargin: true
})<{ fontSize?: number }>`
  color: ${(props) => props.theme.secondaryText};
  font-size: ${(props) => props.fontSize || 14}px;
  font-weight: 500;

  span {
    color: ${(props) => props.theme.primaryText};
    font-size: ${(props) => props.fontSize || 14}px;
    font-weight: 500;
  }
`;

const PrimaryText = styled(Text).attrs({
  noMargin: true
})<{ fontSize?: number; fontWeight?: number; textAlign?: string }>`
  color: ${(props) => props.theme.primaryText};
  font-size: ${(props) => props.fontSize || 14}px;
  font-weight: ${(props) => props.fontWeight || 500};
  text-align: ${(props) => props.textAlign || "left"};
`;

const ChangeText = styled(Text).attrs({
  noMargin: true
})`
  color: ${(props) => props.theme.input.icons.searchActive};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const PolicyOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PolicyOption = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const CustomPermissionsButton = styled.div`
  display: flex;
  padding-top: 8px;
  padding-bottom: 8px;
  align-items: center;
  justify-content: space-between;
  align-self: stretch;
  cursor: pointer;
  transition: opacity 0.2s ease-in-out;

  &:hover,
  svg:hover {
    opacity: 0.85;
  }

  &:active,
  svg:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
`;

const CustomPermissionsInfo = styled.div`
  display: flex;
  padding: 12px;
  justify-content: center;
  align-items: center;
  gap: 10px;
  align-self: stretch;
  border: 1px solid ${(props) => props.theme.backgroundSecondary};
  border-radius: 8px;
`;

const ConnectPageSection = styled(Section)`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 0px;
`;

const ConnectPageSectionHeader = styled.div`
  text-align: center;
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
`;
