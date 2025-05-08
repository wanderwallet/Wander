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
      <Box style={{ gap: 28 }}>
        <Flex
          direction="column"
          gap={12}
          style={{
            width: "100%",
            borderRadius: 8,
            padding: 16,
            borderColor: "var(--brand-color-error2)",
            borderWidth: 1,
            borderStyle: "solid",
            backgroundColor: "rgba(255, 59, 48, 0.05)",
          }}>
          <Text variant="bodyLg" alignment="left" style={{ color: "var(--brand-color-error2)", fontWeight: 600 }}>
            ⚠️ Account Recovery Warning
          </Text>
          <Text variant="bodySm" alignment="left" style={{ color: "#121212" }}>
            By proceeding with account recovery, you'll need to recover your wallets. Please review the status of your
            wallets below carefully.
          </Text>
        </Flex>

        {lostWallets.length > 0 && (
          <Flex
            direction="column"
            gap={12}
            style={{
              width: "100%",
              borderRadius: 8,
              padding: 16,
              borderColor: "var(--brand-color-error2)",
              borderWidth: 1,
              borderStyle: "solid",
              backgroundColor: "rgba(255, 59, 48, 0.05)",
            }}>
            <Text variant="bodyMd" alignment="left" style={{ color: "var(--brand-color-error2)", fontWeight: 600 }}>
              ⚠️ Wallets that will be lost forever
            </Text>
            <Text variant="bodySm" alignment="left" style={{ color: "#121212" }}>
              These wallets have never been backed up and will be permanently lost during recovery. Make sure you have
              backed up any important data or funds.
            </Text>
            <Flex direction="column" gap={8} style={{ marginTop: 8 }}>
              {lostWallets.map((wallet) => (
                <Flex key={wallet.id} direction="row" gap={8} align="center">
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
            gap={12}
            style={{
              width: "100%",
              borderRadius: 8,
              padding: 16,
              borderColor: "#BD8802",
              borderWidth: 1,
              borderStyle: "solid",
              backgroundColor: "rgba(189, 136, 2, 0.05)",
            }}>
            <Text variant="bodyMd" alignment="left" style={{ color: "#BD8802", fontWeight: 600 }}>
              🔄 Wallets that can be recovered
            </Text>
            <Text variant="bodySm" alignment="left" style={{ color: "#121212" }}>
              These wallets can be recovered after you sign in with your authentication method. You'll need to follow
              the recovery process for each wallet.
            </Text>
            <Flex direction="column" gap={8} style={{ marginTop: 8 }}>
              {recoverableWallets.map((wallet) => (
                <Flex key={wallet.id} direction="row" gap={8} align="center">
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

        <Flex direction="column">
          <Checkbox
            isChecked={isChecked}
            label={
              lostWallets.length > 0
                ? "I understand that some wallets will be permanently lost and I want to proceed with recovery"
                : "I understand the recovery process and want to proceed"
            }
            handleChange={() => setIsChecked(!isChecked)}
          />

          <Button
            isFullWidth
            isDisabled={isLoading || !isChecked}
            isLoading={isLoading}
            onClick={handleRecoverAccount}
            style={{ marginTop: 8 }}>
            Recover account
          </Button>
        </Flex>
      </Box>
    </Card>
  );
}
