import { useEmbedded } from "~utils/embedded/embedded.hooks";
import {
  Box,
  Button,
  Card,
  Copyable,
  KeyIcon,
  Row,
  SeedIcon,
  Snackbar,
  WanderIcon,
  WarningIcon,
  Text
} from "~components/embed/ui";
import copy from "copy-to-clipboard";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { useEffect, useState } from "react";

export function AccountExportWalletEmbeddedView() {
  const { currentWallet, downloadKeyfile, copySeedphrase } = useEmbedded();
  const walletAddress = currentWallet.address;

  const [hasEncryptedSeedPhrase, setHasEncryptedSeedPhrase] = useState(false);

  useEffect(() => {
    WalletUtils.hasEncryptedSeedPhrase(currentWallet.id).then(
      (hasEncryptedSeedPhrase) => {
        setHasEncryptedSeedPhrase(hasEncryptedSeedPhrase);
      }
    );
  }, [currentWallet.id]);

  // TODO: Add an option to encrypt with a password

  return (
    <Card
      headerText="Export your private key"
      subtitle="Upload your private key to connect your wallet to your account."
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
      hasCloseButton={true}
      onCloseButtonClick={() => {
        window.history.back();
      }}
      size="auto"
    >
      <Box>
        <Snackbar
          isFullWidth
          icon={<WarningIcon />}
          text="Do not share this with anyone."
          backgroundColor="#F2DC1320"
          borderColor="#F2DC1320"
          textColor="#757575"
          iconColor="#BD8802"
        />
        <Copyable
          style={{ margin: "32px 0" }}
          isFullWidth
          label="Your account address"
          onClick={() => {
            return copy(walletAddress);
          }}
          value={walletAddress}
        />
        <Button
          onClick={() => downloadKeyfile()}
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
        >
          Export keyfile
        </Button>
        <Button
          onClick={() => copySeedphrase()}
          variant="outlined"
          isFullWidth
          isDisabled={!hasEncryptedSeedPhrase}
          icon={<SeedIcon fontSize={24} />}
        >
          Copy seedphrase
        </Button>
      </Box>
    </Card>
  );
}
