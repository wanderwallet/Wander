import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import { Flex } from "~components/common/Flex";
import { Box, Button, Card, Text, Checkbox } from "~components/embed/ui";
import { WanderFooter } from "~components/embed/ui/templates/wander-footer/WanderFooter";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { formatAddress } from "~utils/format";
import { withRetry } from "~utils/promises/retry";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRecoverAccountConfirmEmbeddedView() {
  const { navigate } = useLocation();
  const {
    recoverAccount,
    recoverWallet,
    recoverableAccount,
    deleteImportedTempWallet,
    setRecoverableAccount,
    recoverableAccountWallets,
    authProviderType,
    wallets,
  } = useEmbedded();
  const [shouldRecoverWallet, setShouldRecoverWallet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const isAccountRecovered = useRef(false);
  const isWalletRecovered = useRef(false);
  const walletsRef = useRef(wallets);

  const lostWallets = useMemo(
    () => recoverableAccountWallets?.filter((wallet) => wallet.canBeRecovered === false) || [],
    [recoverableAccountWallets],
  );

  const recoverableWallets = useMemo(
    () => recoverableAccountWallets?.filter((wallet) => wallet.canBeRecovered === true) || [],
    [recoverableAccountWallets],
  );

  const handleRecoverWallet = useCallback(async () => {
    try {
      if (!isWalletRecovered.current) {
        setIsLoading(true);
        await new Promise((resolve) => {
          const interval = setInterval(() => {
            if (walletsRef.current.length > 0) {
              clearInterval(interval);
              resolve(true);
            }
          }, 1000);
        });
        await withRetry(recoverWallet, 3, 1000);
        await deleteImportedTempWallet();
        isWalletRecovered.current = true;
      }
    } catch {
    } finally {
      setRecoverableAccount(null);
      navigate(EmbeddedPaths.WalletHomeEmbeddedView);
      setIsLoading(false);
    }
  }, [recoverWallet, deleteImportedTempWallet, navigate]);

  const handleRecoverAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      setShouldRecoverWallet(false);
      if (walletsRef.current.length > 0) {
        isAccountRecovered.current = true;
        setShouldRecoverWallet(true);
        return;
      }

      if (!isAccountRecovered.current) {
        await recoverAccount(authProviderType, recoverableAccount.userId);
        isAccountRecovered.current = true;
        setShouldRecoverWallet(true);
      }
    } catch (error) {
      toast.error(error?.message || "Error recovering account");
    } finally {
      setIsLoading(false);
    }
  }, [recoverAccount, recoverableAccount, authProviderType]);

  useEffect(() => {
    if (shouldRecoverWallet && !isWalletRecovered.current) {
      handleRecoverWallet();
      setShouldRecoverWallet(false);
    }
  }, [shouldRecoverWallet, handleRecoverWallet]);

  useEffect(() => {
    walletsRef.current = wallets;
  }, [wallets]);

  return (
    <Card
      headerText="Recover account"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/auth/recover-account/select")}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate("/wallet")}
      size="auto">
      <Flex
        direction="column"
        style={{
          minHeight: "500px",
          maxHeight: "calc(100vh - 200px)",
          position: "relative",
          overflow: "hidden",
        }}>
        <Box
          style={{
            gap: 16,
            overflowY: "auto",
            padding: "100px 16px 24px 16px",
            scrollbarWidth: "thin",
            flex: 1,
            minHeight: "300px",
            overscrollBehavior: "contain",
            isolation: "isolate",
            display: "flex",
            flexDirection: "column",
          }}>
          <Flex
            direction="column"
            gap={8}
            style={{
              width: "100%",
              borderRadius: 12,
              padding: 20,
              borderColor: "var(--brand-color-error2)",
              borderWidth: 1,
              borderStyle: "solid",
              backgroundColor: "rgba(255, 59, 48, 0.05)",
            }}>
            <Text variant="bodyLg" alignment="left" style={{ color: "var(--brand-color-error2)", fontWeight: 600 }}>
              ⚠️ Before You Proceed
            </Text>
            <Text variant="bodySm" alignment="left" style={{ color: "#121212", lineHeight: 1.5 }}>
              Account recovery requires you to recover each wallet separately. Please review your wallets below to
              understand what will happen to each one.
            </Text>
          </Flex>

          {lostWallets.length > 0 && (
            <Flex
              direction="column"
              gap={8}
              style={{
                width: "100%",
                borderRadius: 12,
                padding: 20,
                borderColor: "var(--brand-color-error2)",
                borderWidth: 1,
                borderStyle: "solid",
                backgroundColor: "rgba(255, 59, 48, 0.05)",
              }}>
              <Text variant="bodyMd" alignment="left" style={{ color: "var(--brand-color-error2)", fontWeight: 600 }}>
                ⚠️ Wallets That Cannot Be Recovered
              </Text>
              <Text variant="bodySm" alignment="left" style={{ color: "#121212", lineHeight: 1.5 }}>
                These wallets have never been backed up. After recovery, you will permanently lose access to these
                wallets.
              </Text>
              <Flex direction="column" gap={8} style={{ marginTop: 12 }}>
                {lostWallets.map((wallet, index) => (
                  <Flex key={`lost-wallet-${index}`} direction="row" gap={8} align="center">
                    <Text variant="bodyXs" alignment="left" style={{ color: "var(--brand-color-error2)" }}>
                      •
                    </Text>
                    <Text variant="bodyXs" alignment="left" style={{ color: "#121212", fontFamily: "monospace" }}>
                      {formatAddress(wallet.address, 16)}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          )}

          {recoverableWallets.length > 0 && (
            <Flex
              direction="column"
              gap={8}
              style={{
                width: "100%",
                borderRadius: 12,
                padding: 20,
                borderColor: "#BD8802",
                borderWidth: 1,
                borderStyle: "solid",
                backgroundColor: "rgba(189, 136, 2, 0.05)",
              }}>
              <Text variant="bodyMd" alignment="left" style={{ color: "#BD8802", fontWeight: 600 }}>
                🔄 Wallets That Can Be Recovered
              </Text>
              <Text variant="bodySm" alignment="left" style={{ color: "#121212", lineHeight: 1.5 }}>
                These wallets can be recovered. You will need to follow the recovery process for each wallet. Make sure
                you have your recovery information (recovery file, seed phrase or private key) ready.
              </Text>
              <Flex direction="column" gap={8} style={{ marginTop: 12 }}>
                {recoverableWallets.map((wallet, index) => (
                  <Flex key={`recoverable-wallet-${index}`} direction="row" gap={8} align="center">
                    <Text variant="bodyXs" alignment="left" style={{ color: "#BD8802" }}>
                      •
                    </Text>
                    <Text variant="bodyXs" alignment="left" style={{ color: "#121212", fontFamily: "monospace" }}>
                      {formatAddress(wallet.address, 16)}
                    </Text>
                  </Flex>
                ))}
              </Flex>
            </Flex>
          )}
        </Box>

        <Flex
          direction="column"
          style={{
            padding: "4px var(--spacing-3)",
            borderTop: "1px solid var(--brand-color-gray2)",
            marginTop: "auto",
            position: "relative",
            zIndex: 1,
          }}>
          <Checkbox
            isChecked={isChecked}
            label={
              lostWallets.length > 0
                ? "I understand some wallets will be permanently lost."
                : "I have my recovery information ready for each wallet."
            }
            handleChange={() => setIsChecked(!isChecked)}
          />

          <Button
            isFullWidth
            isDisabled={isLoading || !isChecked}
            isLoading={isLoading}
            onClick={handleRecoverAccount}
            style={{ marginTop: 12 }}>
            Recover account
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}
