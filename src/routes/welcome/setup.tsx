import { AnimatePresence, type Variants, motion } from "framer-motion";
import { createContext, useCallback, useEffect, useState } from "react";
import { Spacer, useToasts } from "@arconnect/components";
import { Card, Text } from "@arconnect/components-rebrand";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { jwkFromMnemonic } from "~wallets/generator";
import browser from "webextension-polyfill";
import * as bip39 from "bip39-web-crypto";
import styled from "styled-components";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import Pagination from "~components/Pagination";
import { getWalletKeyLength } from "~wallets";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import WanderIcon from "url:assets/icon.svg";

// Shared:
import { PasswordWelcomeView } from "./load/password";
import { ThemeWelcomeView } from "./load/theme";

// Generate:
import { AccountWelcomeView } from "./generate/account";
import { BackupWelcomeView } from "./generate/backup";
import { ConfirmWelcomeView } from "./generate/confirm";
import { GenerateDoneWelcomeView } from "./generate/done";

// Load:
import { WalletsWelcomeView } from "./load/wallets";
import { Redirect } from "~wallets/router/components/redirect/Redirect";
import StarIcons from "~components/welcome/StarIcons";
import { ArrowNarrowLeft } from "@untitled-ui/icons-react";
import { PermissionsWelcomeView } from "./generate/permissions";
import { OptionsWelcomView } from "./load/options";
import IconText from "~components/IconText";
// Wallet generate pages:

const LoadViews = [
  WalletsWelcomeView,
  AccountWelcomeView,
  PasswordWelcomeView,
  ThemeWelcomeView,
  PermissionsWelcomeView,
  GenerateDoneWelcomeView
];
const KeystoneViews = [
  WalletsWelcomeView,
  PasswordWelcomeView,
  ThemeWelcomeView,
  PermissionsWelcomeView,
  GenerateDoneWelcomeView
];

// TODO: Use a nested router instead:
const ViewsBySetupMode = {
  generate: [
    AccountWelcomeView,
    BackupWelcomeView,
    ConfirmWelcomeView,
    PasswordWelcomeView,
    ThemeWelcomeView,
    PermissionsWelcomeView,
    GenerateDoneWelcomeView
  ],
  load: [OptionsWelcomView],
  recoveryPhraseLoad: LoadViews,
  keyfileLoad: LoadViews,
  qrLoad: LoadViews,
  keystoneLoad: KeystoneViews
} as const;

const VIEW_TITLES_BY_SETUP_MODE = {
  generate: "create_a_new_account",
  load: "import_an_account",
  recoveryPhraseLoad: "import_an_account",
  keyfileLoad: "import_an_account",
  qrLoad: "import_an_account",
  keystoneLoad: "import_an_account"
} as const;

const remainingLoadSubtitles = [
  "name_your_account",
  "create_a_password",
  "choose_ui_theme",
  "enable_permissions",
  "congratulations"
];

const remainingKeystoneSubtitles = [
  "create_a_password",
  "choose_ui_theme",
  "enable_permissions",
  "congratulations"
];

const VIEW_SUBTITLES_BY_SETUP_MODE = {
  generate: [
    "name_your_account",
    "backup_your_account",
    "confirm_your_recovery_phrase",
    "create_a_password",
    "choose_ui_theme",
    "enable_permissions",
    "congratulations"
  ],
  load: [""],
  recoveryPhraseLoad: ["enter_recovery_phrase", ...remainingLoadSubtitles],
  keyfileLoad: ["upload_key_file", ...remainingLoadSubtitles],
  qrLoad: ["scan_qr_code", ...remainingLoadSubtitles],
  keystoneLoad: ["keystone_connect_title", ...remainingKeystoneSubtitles]
};

export type WelcomeSetupMode =
  | "generate"
  | "load"
  | "recoveryPhraseLoad"
  | "keyfileLoad"
  | "qrLoad"
  | "keystoneLoad";

export interface SetupWelcomeViewParams {
  setupMode: WelcomeSetupMode;
  page: string;
}

export type SetupWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function SetupWelcomeView({ params }: SetupWelcomeViewProps) {
  const { navigate } = useLocation();
  const { setupMode, page: pageParam } = params;
  const page = Number(pageParam);

  const pageTitle = VIEW_TITLES_BY_SETUP_MODE[setupMode];
  const pageSubtitle = VIEW_SUBTITLES_BY_SETUP_MODE[setupMode][page - 1];
  const pageCount = ViewsBySetupMode[setupMode].length;
  const transparentBackground = setupMode !== "load" && pageCount === page;
  const hidePagination = setupMode === "load" && page === 1;

  // temporarily stored password
  const [password, setPassword] = useState("");

  // toasts
  const { setToast } = useToasts();

  // generate wallet in the background
  const [generatedWallet, setGeneratedWallet] = useState<GeneratedWallet>({});

  const navigateToPreviousPage = () => {
    if (setupMode !== "generate" && setupMode !== "load" && page === 1) {
      navigate("/load/1");
    } else if (page === 1) {
      navigate("/");
    } else {
      navigate(`/${setupMode}/${page - 1}`);
    }
  };

  async function generateWallet() {
    // only generate wallet if the
    // setup mode is wallet generation
    if (setupMode !== "generate" || generatedWallet.address) return;

    // prevent user from closing the window
    // while Wander is generating a wallet
    window.onbeforeunload = () =>
      browser.i18n.getMessage("close_tab_generate_wallet_message");

    try {
      const arweave = new Arweave(defaultGateway);

      // generate seed
      const seed = await bip39.generateMnemonic();

      setGeneratedWallet({ mnemonic: seed });

      // generate wallet from seedphrase
      let generatedKeyfile = await jwkFromMnemonic(seed);

      let { actualLength, expectedLength } = await getWalletKeyLength(
        generatedKeyfile
      );
      while (expectedLength !== actualLength) {
        generatedKeyfile = await jwkFromMnemonic(seed);
        ({ actualLength, expectedLength } = await getWalletKeyLength(
          generatedKeyfile
        ));
      }

      setGeneratedWallet((val) => ({ ...val, jwk: generatedKeyfile }));

      // get address
      const address = await arweave.wallets.jwkToAddress(generatedKeyfile);

      setGeneratedWallet((val) => ({ ...val, address }));

      return generatedWallet;
    } catch (e) {
      console.log("Error generating wallet", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_generating_wallet"),
        duration: 2300
      });
    }

    return {};
  }

  function setAccountName(name: string) {
    setGeneratedWallet((val) => ({ ...val, nickname: name }));
  }

  useEffect(() => {
    if (setupMode === "generate") {
      generateWallet();
    }
  }, [setupMode]);

  // animate content sice
  const [contentSize, setContentSize] = useState<number>(0);

  const contentRef = useCallback<(el: HTMLDivElement) => void>((el) => {
    if (!el) return;

    const obs = new ResizeObserver(() => {
      if (!el || el.clientHeight <= 0) return;
      setContentSize(el.clientHeight);
    });

    obs.observe(el);
  }, []);

  if (
    isNaN(page) ||
    page < 1 ||
    page > pageCount ||
    (setupMode === "generate" && page > 4 && password === "") ||
    (setupMode !== "generate" && page > 3 && password === "")
  ) {
    return <Redirect to={`/${setupMode}/1`} />;
  }

  if (
    setupMode !== "generate" &&
    setupMode !== "load" &&
    setupMode !== "recoveryPhraseLoad" &&
    setupMode !== "keyfileLoad" &&
    setupMode !== "qrLoad" &&
    setupMode !== "keystoneLoad"
  ) {
    return <Redirect to="/" />;
  }

  const CurrentView = ViewsBySetupMode[setupMode][page - 1];

  return (
    <Wrapper linearBackground={transparentBackground}>
      <Header>
        <HeaderIconWrapper>
          <Image
            width="57.61px"
            height="27px"
            src={WanderIcon}
            alt="Wander Icon"
          />
          <IconText width={116.759} height={24.111} />
        </HeaderIconWrapper>
        <Text variant="secondary" size="base" weight="medium">
          {browser.i18n.getMessage("need_help")}
        </Text>
      </Header>
      <StarIcons screen="setup" />
      <Spacer y={2} />
      <SetupCard transparentBackground={transparentBackground}>
        {!transparentBackground && (
          <HeaderContainer>
            <CardHeader>
              <BackButton onClick={navigateToPreviousPage} />
              <Text style={{ fontSize: 22, margin: "auto" }} weight="bold">
                {browser.i18n.getMessage(pageTitle)}
              </Text>
              <Spacer x={1.75} />
            </CardHeader>
            {!hidePagination && (
              <PaginationContainer>
                <Pagination
                  currentPage={page}
                  totalPages={pageCount}
                  subtitle={pageSubtitle}
                />
              </PaginationContainer>
            )}
          </HeaderContainer>
        )}
        <PasswordContext.Provider value={{ password, setPassword }}>
          <WalletContext.Provider
            value={{
              wallet: generatedWallet,
              generateWallet,
              setAccountName,
              setWallet: (wallet) => setGeneratedWallet(wallet)
            }}
          >
            <Content>
              <PageWrapper style={{ height: contentSize }}>
                <AnimatePresence initial={false}>
                  <Page key={page} ref={contentRef}>
                    <CurrentView params={params} />
                  </Page>
                </AnimatePresence>
              </PageWrapper>
            </Content>
          </WalletContext.Provider>
        </PasswordContext.Provider>
      </SetupCard>
      <Spacer y={2} />
    </Wrapper>
  );
}

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 64px;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
`;

const HeaderIconWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 9.65px;
`;

export const Content = styled.div`
  overflow: hidden;
  height: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const PageWrapper = styled.div`
  position: relative;
  transition: height 0.17s ease;
  height: 100%;
  display: flex;
  flex: 1;
`;

const pageAnimation: Variants = {
  init: {
    opacity: 1
  },
  exit: {
    opacity: 0
  }
};

const Page = styled(motion.div).attrs({
  variants: pageAnimation,
  initial: "exit",
  animate: "init"
})`
  position: absolute;
  width: 100%;
  height: 100%;
  left: 0;
  top: 0;
  display: flex;
  flex-direction: column;
`;

export const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5em;
`;

export const BackButton = styled(ArrowNarrowLeft)<{ hidden?: boolean }>`
  font-size: 1.6rem;
  display: ${(props) => props.hidden && "none"}
  width: 1.5em;
  height: 1.5em;
  color: ${(props) => props.theme.secondaryText};
  z-index: 2;

  &:hover {
    cursor: pointer;
  }

  path {
    stroke-width: 1.75 !important;
  }
`;

export const Wrapper = styled.div<{ linearBackground?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  min-height: 100vh;
  flex-direction: column;
  position: relative;
  ${({ theme, linearBackground }) =>
    linearBackground
      ? `background: linear-gradient(180deg, ${
          theme.displayTheme === "dark" ? "#26126F" : "#F0E8FF"
        } 0%, ${theme.displayTheme === "dark" ? "#111" : "#F8F9FC"} 23.74%)`
      : `background: radial-gradient(50% 50% at 50% 50%, ${
          theme.displayTheme === "dark" ? "#26126f" : "#F0E8FF"
        } 0%, ${theme.displayTheme === "dark" ? "#1c1c1d" : "#F8F9FC"} 86.5%)`}
`;

const Image = styled.img`
  color: ${(props) => props.theme.primaryText};
`;

export const SetupCard = styled(Card)<{ transparentBackground?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  width: 377.5px;
  min-height: 600px;
  ${({ transparentBackground }) =>
    transparentBackground && `background: transparent; border: none;`}
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
`;

export const PasswordContext = createContext({
  setPassword: (password: string) => {},
  password: ""
});

export const WalletContext = createContext<WalletContextValue>({
  wallet: {},
  setWallet: (wallet: GeneratedWallet) => {},
  generateWallet: (retry?: boolean) => Promise.resolve({}),
  setAccountName: (name: string) => {}
});

interface WalletContextValue {
  wallet: GeneratedWallet;
  setWallet: (wallet: GeneratedWallet) => void;
  generateWallet: (retry?: boolean) => Promise<GeneratedWallet>;
  setAccountName: (name: string) => void;
}

interface GeneratedWallet {
  address?: string;
  mnemonic?: string;
  jwk?: JWKInterface;
  nickname?: string;
}
