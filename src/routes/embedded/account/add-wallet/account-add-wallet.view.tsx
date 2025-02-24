import { useCallback, useEffect, useState } from "react";
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

export function AccountAddWalletEmbeddedView() {
  const { authMethod, generateTempWallet, registerWallet } = useEmbedded();
  const [isLoading, setIsLoading] = useState({
    calledId: "",
    status: false
  });

  useEffect(() => {
    // Pre-generation starts on app load, but this call will re-generate it again if it has expired, as we are trying to
    // prevent a user accessing a site with ArConnect Embedded, not creating an account, and coming back way later after
    // the pregenerated wallet has been sitting in memory for long:
    generateTempWallet();
  }, []);

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const handleRegisterWallet = useCallback(
    async (source: "generated" | "imported") => {
      setIsLoading({ calledId: source, status: true });
      await registerWallet(source);
      setIsLoading({ calledId: "", status: false });
    },
    []
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
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={false}
      size="auto"
    >
      <Box>
        <Button
          onClick={() => handleRegisterWallet("generated")}
          variant="outlined"
          isFullWidth
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
          icon={<WalletIcon fontSize={24} />}
          href="/auth/import-seed-phrase"
        >
          Enter Seed Phrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          href="/auth/import-keyfile"
        >
          Import Keyfile
        </Button>
        {authMethod === "passkey" ? (
          <Button
            variant="outlined"
            isFullWidth
            icon={<QRCodeIcon fontSize={24} />}
            href="/auth/add-device"
          >
            Add this device to an existing account
          </Button>
        ) : (
          <Button
            variant="outlined"
            isFullWidth
            icon={<QRCodeIcon fontSize={24} />}
            href="/auth/add-auth-provider"
          >
            Add {authMethod.toLocaleUpperCase()} to an existing account
          </Button>
        )}
      </Box>
    </Card>
  );
}
