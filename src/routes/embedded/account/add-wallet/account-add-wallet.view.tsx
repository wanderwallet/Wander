import type { WalletSourceType } from "embed-api";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  KeyIcon,
  QRCodeIcon,
  Row,
  SeedIcon,
  WalletIcon,
  WanderIcon,
  Text
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountAddWalletEmbeddedView() {
  const { authProviderType, generateTempWallet, registerWallet } =
    useEmbedded();
  const [isLoading, setIsLoading] = useState({
    calledId: "",
    status: false
  });

  useEffect(() => {
    // Pre-generation starts on app load, but this call will re-generate it again if it has expired, as we are trying to
    // prevent a user accessing a site with Wander Embedded, not creating an account, and coming back way later after
    // the pregenerated wallet has been sitting in memory for long:
    generateTempWallet();
  }, []);

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const handleRegisterWallet = useCallback(async (source: WalletSourceType) => {
    setIsLoading({ calledId: source, status: true });
    await registerWallet(source);
    setIsLoading({ calledId: "", status: false });
  }, []);

  const isDisabled = useMemo(
    () => isLoading.status === true,
    [isLoading.status]
  );

  return (
    <Card
      headerText="Add a wallet"
      subtitle="Add a wallet to your account to hold your funds. Create or add an existing wallet to continue."
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto"
    >
      <Box>
        <Button
          onClick={() => handleRegisterWallet("GENERATED")}
          variant="outlined"
          isFullWidth
          isDisabled={isDisabled}
          icon={<SeedIcon fontSize={24} />}
          isLoading={
            isLoading.calledId === "generated" && isLoading.status === true
          }
        >
          Create new wallet
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          isDisabled={isDisabled}
          icon={<WalletIcon fontSize={24} />}
          href="#/auth/import-seedphrase"
        >
          Enter Seed Phrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          isDisabled={isDisabled}
          icon={<KeyIcon fontSize={24} />}
          href="#/auth/import-keyfile"
        >
          Import Keyfile
        </Button>
        {authProviderType === "PASSKEYS" ? (
          <Button
            variant="outlined"
            isFullWidth
            isDisabled={isDisabled}
            icon={<QRCodeIcon fontSize={24} />}
            href="#/auth/add-device"
          >
            Add this device to an existing account
          </Button>
        ) : (
          <Button
            variant="outlined"
            isFullWidth
            isDisabled={isDisabled}
            icon={<QRCodeIcon fontSize={24} />}
            href="#/auth/add-auth-provider"
          >
            Add {authProviderType.toLocaleUpperCase()} to an existing account
          </Button>
        )}
      </Box>
    </Card>
  );
}
