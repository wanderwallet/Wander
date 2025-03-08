import { isValidMnemonic, jwkFromMnemonic } from "~wallets/generator";
import { ExtensionStorage, OLD_STORAGE_NAME } from "~utils/storage";
import {
  addWallet,
  getWalletKeyLength,
  getWallets,
  setActiveWallet
} from "~wallets";
import {
  decodeAccount,
  type KeystoneAccount
} from "~wallets/hardware/keystone";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { useContext, useEffect, useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import {
  PasswordContext,
  WalletContext,
  type SetupWelcomeViewParams
} from "../setup";
import {
  Button,
  Modal,
  Spacer,
  Text,
  useModal,
  useToasts
} from "@arconnect/components-rebrand";
import Migrate from "~components/welcome/load/Migrate";
import SeedInput from "~components/SeedInput";
import Paragraph from "~components/Paragraph";
import browser from "webextension-polyfill";
import styled from "styled-components";
import { WalletKeySizeErrorModal } from "~components/modals/WalletKeySizeErrorModal";
import { useLocation } from "~wallets/router/router.utils";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { loadTokens } from "~tokens/token";
import { defaultGateway } from "~gateways/gateway";
import Arweave from "arweave";
import { Webcam01 } from "@untitled-ui/icons-react";
import QRLoopScanner, {
  ScannerContainer,
  VideoContainer
} from "~components/welcome/load/QRLoopScanner";
import { useScanner, AnimatedQRScanner } from "@arconnect/keystone-sdk";
import { addHardwareWallet } from "~wallets/hardware";
import {
  Alert,
  Icon as WarningIcon
} from "~components/auth/CustomGatewayWarning";
import { useActiveWallet } from "~wallets/hooks";

export type WalletsWelcomeViewProps = CommonRouteProps<SetupWelcomeViewParams>;

export function WalletsWelcomeView({ params }: WalletsWelcomeViewProps) {
  const { navigate } = useLocation();

  const [mnemonicLength, setMnemonicLength] = useState<number>(12);
  const [scanMode, setScanMode] = useState(false);

  // password context
  const { password } = useContext(PasswordContext);

  // wallet context
  const { wallet, setWallet } = useContext(WalletContext);

  const activeWallet = useActiveWallet();
  // wallet generation taking longer
  const [showLongWaitMessage, setShowLongWaitMessage] = useState(false);

  // migration available
  const [oldState] = useStorage({
    key: OLD_STORAGE_NAME,
    instance: ExtensionStorage
  });

  // migration modal
  const migrationModal = useModal();

  // wallet size error modal
  const walletModal = useModal();

  // wallets to migrate
  const [walletsToMigrate, setWalletsToMigrate] = useState<JWKInterface[]>([]);

  useEffect(() => {
    try {
      if (!oldState.wallets) {
        return migrationModal.setOpen(false);
      }

      const oldWallets: {
        address: string;
        keyfile: string;
        name: string;
      }[] = JSON.parse(oldState.wallets);
      const parsedWallets: JWKInterface[] = [];

      // parse old wallets
      for (let i = 0; i < oldWallets.length; i++) {
        const w = oldWallets[i];

        if (!w.keyfile) continue;

        try {
          const keyfile: JWKInterface = JSON.parse(atob(w.keyfile));

          parsedWallets.push(keyfile);
        } catch {}
      }

      setWalletsToMigrate(parsedWallets);

      // open modal
      migrationModal.setOpen(parsedWallets.length > 0);
    } catch {
      migrationModal.setOpen(false);
    }
  }, [oldState]);

  // toasts
  const { setToast } = useToasts();

  // loading
  const [loading, setLoading] = useState(false);

  // seedphrase or jwk loaded from
  // the seedphrase component
  const [loadedWallet, setLoadedWallet] = useState<JWKInterface | string>();

  const isValidRecoveryPhrase = useMemo(() => {
    if (typeof loadedWallet === "string") {
      try {
        const length = isValidMnemonic(loadedWallet);
        return length === mnemonicLength;
      } catch {
        return false;
      }
    }

    return false;
  }, [loadedWallet, mnemonicLength]);

  // done
  async function done(directWallet?: string | JWKInterface) {
    if (loading) return;
    setLoading(true);

    // prevent user from closing the window
    // while Wander is loading the wallet
    window.onbeforeunload = () =>
      browser.i18n.getMessage("close_tab_load_wallet_message");

    const finishUp = () => {
      // reset before unload
      window.onbeforeunload = null;
      setShowLongWaitMessage(false);
      setLoading(false);
    };

    const walletToLoad = directWallet || loadedWallet;

    // validate mnemonic
    if (typeof walletToLoad === "string") {
      try {
        isValidMnemonic(walletToLoad);
      } catch (e) {
        console.log("Invalid mnemonic provided", e);
        setToast({
          type: "error",
          content: browser.i18n.getMessage("invalid_mnemonic"),
          duration: 2000
        });
        finishUp();
      }
    }

    try {
      // if the user migrated from a previous version,
      // they already have wallets added
      const existingWallets = await getWallets();

      if (walletToLoad) {
        // load jwk from seedphrase input state
        const startTime = Date.now();

        let jwk =
          typeof walletToLoad === "string"
            ? await jwkFromMnemonic(walletToLoad)
            : walletToLoad;

        let { actualLength, expectedLength } = await getWalletKeyLength(jwk);
        if (expectedLength !== actualLength) {
          if (typeof walletToLoad !== "string") {
            walletModal.setOpen(true);
            finishUp();
            return;
          } else {
            while (expectedLength !== actualLength) {
              setShowLongWaitMessage(Date.now() - startTime > 30000);
              jwk = await jwkFromMnemonic(walletToLoad);
              ({ actualLength, expectedLength } = await getWalletKeyLength(
                jwk
              ));
            }
          }
        }

        const arweave = new Arweave(defaultGateway);
        const address = await arweave.wallets.getAddress(jwk);
        setWallet({ address, jwk });

        // add wallet
        // await addWallet(jwk, password);

        // load tokens
        // await loadTokens();
      } else if (existingWallets.length < 1) {
        // the user has not migrated, so they need to add a wallet
        return finishUp();
      }

      // continue to the next page
      // navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
    } catch (e) {
      console.log("Failed to load wallet", e);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("error_adding_wallet"),
        duration: 2000
      });
    }

    finishUp();
  }

  // done for keystone wallet
  async function keystoneDone(account: KeystoneAccount) {
    // update active address
    // we need this because we don't
    // have any other wallets added yet
    await setActiveWallet(account.address);

    // redirect
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
  }

  function handleYesImport() {
    navigate(`/${params.setupMode}/${Number(params.page) + 1}`);
  }

  function handleNoImport() {
    setWallet({});
  }

  // migration available
  const migrationAvailable = useMemo(
    () => walletsToMigrate.length > 0,
    [walletsToMigrate]
  );

  // migration cancelled
  const [migrationCancelled, setMigrationCancelled] = useState(false);

  if (params.setupMode === "recoveryPhraseLoad") {
    return (
      <Container>
        {!wallet?.address ? (
          <Content>
            <Paragraph>
              {browser.i18n.getMessage("provide_seedphrase_paragraph")}
            </Paragraph>
            <SeedInput
              onChange={setLoadedWallet}
              onReady={done}
              onMnemonicLengthChange={setMnemonicLength}
            />
            {migrationAvailable && (
              <Migrate
                wallets={walletsToMigrate}
                noMigration={migrationCancelled}
                onMigrateClick={() => {
                  migrationModal.setOpen(true);
                  setMigrationCancelled(false);
                }}
              />
            )}
          </Content>
        ) : (
          <Content
            style={{
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center"
            }}
          >
            <Text size="md" weight="medium" noMargin>
              {browser.i18n.getMessage("found_account_with_phrase")}
            </Text>
            <AddressContainer>
              <Text size="sm" weight="medium" noMargin>
                {wallet.address}
              </Text>
            </AddressContainer>
          </Content>
        )}
        {!wallet?.address ? (
          <Actions>
            <Button fullWidth onClick={() => done()} loading={loading}>
              {browser.i18n.getMessage(
                isValidRecoveryPhrase ? "continue" : "complete_recover_phrase"
              )}
            </Button>
            {loading && showLongWaitMessage && (
              <Text
                variant="secondary"
                size="sm"
                noMargin
                style={{ textAlign: "center" }}
              >
                {browser.i18n.getMessage("longer_than_usual")}
              </Text>
            )}
          </Actions>
        ) : (
          <Actions>
            <Button fullWidth onClick={handleYesImport}>
              {browser.i18n.getMessage("yes_import")}
            </Button>
            <Button variant="secondary" fullWidth onClick={handleNoImport}>
              {browser.i18n.getMessage("no_import")}
            </Button>
          </Actions>
        )}
        <Modal
          {...migrationModal.bindings}
          root={document.getElementById("__plasmo")}
          actions={
            <>
              <Button
                fullWidth
                onClick={async () => {
                  try {
                    // add migrated wallets
                    await addWallet(walletsToMigrate, password);

                    // load tokens
                    await loadTokens();

                    // confirmation toast
                    setToast({
                      type: "info",
                      content: browser.i18n.getMessage(
                        "migration_confirmation"
                      ),
                      duration: 2200
                    });
                    migrationModal.setOpen(false);

                    // TODO:
                    // remove old storage
                    // await ExtensionStorage.remove(OLD_STORAGE_NAME);
                  } catch {}
                }}
              >
                {browser.i18n.getMessage("migrate")}
              </Button>
              <Spacer y={0.75} />
              <Button
                fullWidth
                variant="secondary"
                onClick={() => {
                  migrationModal.setOpen(false);
                  setMigrationCancelled(true);
                }}
              >
                {browser.i18n.getMessage("cancel")}
              </Button>
            </>
          }
        >
          <ModalText>
            {browser.i18n.getMessage("migration_available")}
          </ModalText>
          <ModalText>
            {browser.i18n.getMessage("migration_available_paragraph")}
          </ModalText>
          <Spacer y={0.75} />
        </Modal>
        <WalletKeySizeErrorModal {...walletModal} back={() => navigate(`/`)} />
      </Container>
    );
  } else if (params.setupMode === "keyfileLoad") {
    return (
      <Container>
        {!wallet?.address ? (
          <Content>
            <Paragraph>
              {browser.i18n.getMessage("upload_key_file_description")}
            </Paragraph>
            <SeedInput
              inputType="keyfile"
              onChange={setLoadedWallet}
              onReady={done}
              loading={loading}
            />
          </Content>
        ) : (
          <Content
            style={{
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center"
            }}
          >
            <Text size="md" weight="medium" noMargin>
              {browser.i18n.getMessage("found_account_with_phrase")}
            </Text>
            <AddressContainer>
              <Text size="sm" weight="medium" noMargin>
                {wallet.address}
              </Text>
            </AddressContainer>
          </Content>
        )}
        {!wallet?.address ? (
          <Actions>
            <Button fullWidth onClick={() => done()} loading={loading}>
              {browser.i18n.getMessage("continue")}
            </Button>
            {loading && showLongWaitMessage && (
              <Text
                variant="secondary"
                size="sm"
                noMargin
                style={{ textAlign: "center" }}
              >
                {browser.i18n.getMessage("longer_than_usual")}
              </Text>
            )}
          </Actions>
        ) : (
          <Actions>
            <Button fullWidth onClick={handleYesImport}>
              {browser.i18n.getMessage("yes_import")}
            </Button>
            <Button variant="secondary" fullWidth onClick={handleNoImport}>
              {browser.i18n.getMessage("no_import")}
            </Button>
          </Actions>
        )}
        <WalletKeySizeErrorModal {...walletModal} back={() => navigate(`/`)} />
      </Container>
    );
  } else if (params.setupMode === "keystoneLoad") {
    return (
      <Container>
        {!activeWallet?.address ? (
          <Content>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                gap: 24
              }}
            >
              {scanMode ? (
                <KeystoneScanner onSuccess={keystoneDone} />
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center"
                    }}
                  >
                    <Button
                      fullWidth
                      variant="secondary"
                      style={{ gap: 8 }}
                      onClick={() => setScanMode(true)}
                    >
                      <Webcam01 height={24} width={24} />
                      <Text weight="bold" noMargin>
                        {browser.i18n.getMessage("open_webcam")}
                      </Text>
                    </Button>
                  </div>
                  <Alert>
                    <WarningIcon />
                    {browser.i18n.getMessage("keystone_features_warning")}
                  </Alert>
                </div>
              )}
            </div>
          </Content>
        ) : (
          <Content
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div />
            <div
              style={{
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                gap: 24
              }}
            >
              <Text size="md" weight="medium" noMargin>
                {browser.i18n.getMessage("found_account_with_phrase")}
              </Text>
              <AddressContainer>
                <Text size="sm" weight="medium" noMargin>
                  {activeWallet?.address}
                </Text>
              </AddressContainer>
            </div>
            <Actions>
              <Button fullWidth onClick={handleYesImport}>
                {browser.i18n.getMessage("yes_import")}
              </Button>
              <Button variant="secondary" fullWidth onClick={handleNoImport}>
                {browser.i18n.getMessage("no_import")}
              </Button>
            </Actions>
          </Content>
        )}
        {wallet?.address && (
          <Actions>
            <Button fullWidth onClick={handleYesImport}>
              {browser.i18n.getMessage("yes_import")}
            </Button>
            <Button variant="secondary" fullWidth onClick={handleNoImport}>
              {browser.i18n.getMessage("no_import")}
            </Button>
          </Actions>
        )}
      </Container>
    );
  }
  return (
    <Container>
      {!wallet?.address ? (
        <Content>
          <Paragraph>
            {browser.i18n.getMessage("scan_qr_code_description")}
          </Paragraph>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 24
            }}
          >
            <Text size="sm" weight="medium" noMargin>
              {browser.i18n.getMessage("scan_qr_code_instruction")}
            </Text>
            {scanMode ? (
              params.setupMode === "qrLoad" ? (
                <QRLoopScanner
                  onResult={(result) => {
                    setLoadedWallet(result);
                    setScanMode(false);
                    done(result);
                  }}
                />
              ) : (
                <KeystoneScanner onSuccess={keystoneDone} />
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <Button
                  fullWidth
                  variant="secondary"
                  style={{ gap: 8 }}
                  onClick={() => setScanMode(true)}
                >
                  <Webcam01 height={24} width={24} />
                  <Text weight="bold" noMargin>
                    {browser.i18n.getMessage("open_webcam")}
                  </Text>
                </Button>
              </div>
            )}
          </div>
        </Content>
      ) : (
        <Content
          style={{
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center"
          }}
        >
          <Text size="md" weight="medium" noMargin>
            {browser.i18n.getMessage("found_account_with_phrase")}
          </Text>
          <AddressContainer>
            <Text size="sm" weight="medium" noMargin>
              {wallet.address}
            </Text>
          </AddressContainer>
        </Content>
      )}
      {!wallet?.address ? (
        <Actions>
          {loading && showLongWaitMessage && (
            <Text
              variant="secondary"
              size="sm"
              noMargin
              style={{ textAlign: "center" }}
            >
              {browser.i18n.getMessage("longer_than_usual")}
            </Text>
          )}
        </Actions>
      ) : (
        <Actions>
          <Button fullWidth onClick={handleYesImport}>
            {browser.i18n.getMessage("yes_import")}
          </Button>
          <Button variant="secondary" fullWidth onClick={handleNoImport}>
            {browser.i18n.getMessage("no_import")}
          </Button>
        </Actions>
      )}
      <WalletKeySizeErrorModal {...walletModal} back={() => navigate(`/`)} />
    </Container>
  );
}

const KeystoneScanner = ({
  onSuccess
}: {
  onSuccess: (account: KeystoneAccount) => Promise<void>;
}) => {
  // toasts
  const { setToast } = useToasts();

  // connect modal
  const connectModal = useModal();

  // got scan result
  const [gotResult, setGotResult] = useState(false);

  // cancel scanning
  function cancel() {
    scanner.retry();
    connectModal.setOpen(false);
    setGotResult(false);
  }

  // qr-wallet scanner
  const scanner = useScanner(async (res) => {
    // if we already have a result
    // return
    if (gotResult) return;

    setGotResult(true);

    try {
      // load account data
      const account = await decodeAccount(res);

      // add wallet
      await addHardwareWallet(
        {
          address: account.address,
          publicKey: account.owner,
          xfp: account.xfp
        },
        "keystone"
      );

      setToast({
        type: "success",
        content: browser.i18n.getMessage("wallet_hardware_added", "Keystone"),
        duration: 2300
      });

      if (onSuccess) await onSuccess(account);
    } catch {
      setToast({
        type: "error",
        content: browser.i18n.getMessage(
          "wallet_hardware_not_added",
          "Keystone"
        ),
        duration: 2300
      });
    }

    cancel();
  });

  return (
    <ScannerContainer>
      <VideoContainer>
        <AnimatedQRScanner
          {...scanner.bindings}
          onError={(error) =>
            setToast({
              type: "error",
              duration: 2300,
              content: browser.i18n.getMessage(`keystone_${error}`)
            })
          }
        />
      </VideoContainer>
      <Text size="sm" variant="secondary" style={{ textAlign: "center" }}>
        {browser.i18n.getMessage("progress")}: {Math.round(scanner.progress)}%
      </Text>
    </ScannerContainer>
  );
};

const ModalText = styled(Text)`
  text-align: center;
`;

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  overflow: scroll;
  height: 100%;
`;

const Content = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 24px;
`;

const Actions = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  gap: 1rem;
`;

const AddressContainer = styled.div`
  display: flex;
  padding: 12px;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  align-self: stretch;
  border-radius: 8px;
  text-align: center;
  background: ${(props) => props.theme.input.background.dropdown.default};
  overflow: hidden;
  word-wrap: break-word;
  word-break: break-all;
  max-width: 100%;
`;
