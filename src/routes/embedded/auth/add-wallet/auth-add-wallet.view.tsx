import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect } from "react";

import {
  Box,
  Button,
  Card,
  KeyIcon,
  QRCodeIcon,
  Row,
  SeedIcon,
  Text,
  WalletIcon,
  WanderIcon
} from "~components/embed";

export function AuthAddWalletEmbeddedView() {
  const { authMethod, generateTempWallet, registerWallet } = useEmbedded();

  useEffect(() => {
    // Pre-generation starts on app load, but this call will re-generate it again if it has expired, as we are trying to
    // prevent a user accessing a site with ArConnect Embedded, not creating an account, and coming back way later after
    // the pregenerated wallet has been sitting in memory for long:
    generateTempWallet();
  }, []);

  return (
    <Card
      headerText="Add a wallet"
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={false}
      hasCloseButton={false}
      hasShadow={true}
      size="auto"
    >
      <Box>
        <Button
          onClick={() => registerWallet("generated")}
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
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
            Add ${authMethod} to an existing account
          </Button>
        )}
      </Box>
    </Card>
  );
}
