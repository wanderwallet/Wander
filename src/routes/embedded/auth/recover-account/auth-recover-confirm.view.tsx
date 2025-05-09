import { useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Flex } from "~components/common/Flex";
import { Box, Button, Card, WanderFooter, Text, Checkbox } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { formatAddress } from "~utils/format";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRecoverAccountConfirmEmbeddedView() {
  const { navigate } = useLocation();
  const { recoverAccount, recoverableAccount, setRecoverableAccount, recoverableAccountWallets, authProviderType } =
    useEmbedded();
  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const lostWallets = useMemo(
    () => recoverableAccountWallets?.filter((wallet) => wallet.canBeRecovered === false) || [],
    [recoverableAccountWallets],
  );

  const recoverableWallets = useMemo(
    () => recoverableAccountWallets?.filter((wallet) => wallet.canBeRecovered === true) || [],
    [recoverableAccountWallets],
  );

  const handleRecoverAccount = useCallback(async () => {
    try {
      setIsLoading(true);
      await recoverAccount(authProviderType, recoverableAccount.userId);
      setRecoverableAccount(null);
      navigate("/wallet");
    } catch (error) {
      toast.error("Error recovering account");
    } finally {
      setIsLoading(false);
    }
  }, [recoverAccount, recoverableAccount, navigate, setRecoverableAccount, authProviderType]);

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
            padding: "160px 16px 24px 16px",
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
                These wallets have never been backed up. After recovery, you will permanently lose access these wallets.
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
            padding: "20px 16px",
            borderTop: "1px solid var(--brand-color-gray2)",
            backgroundColor: "var(--brand-color-white)",
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
