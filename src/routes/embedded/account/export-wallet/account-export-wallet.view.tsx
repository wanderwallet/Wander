import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Box, Button, Card, Copyable, KeyIcon, SeedIcon, Snackbar, WarningIcon } from "~components/embed/ui";
import copy from "copy-to-clipboard";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { WanderFooter } from "~components/embed/ui/templates/wander-footer/WanderFooter";

export function AccountExportWalletEmbeddedView() {
  const { back } = useLocation();
  const { currentWallet, downloadKeyfile, copySeedphrase } = useEmbedded();
  const walletAddress = currentWallet.address;

  const [hasEncryptedSeedPhrase, setHasEncryptedSeedPhrase] = useState(false);

  useEffect(() => {
    WalletUtils.hasEncryptedSeedPhrase(currentWallet.id).then((hasEncryptedSeedPhrase) => {
      setHasEncryptedSeedPhrase(hasEncryptedSeedPhrase);
    });
  }, [currentWallet.id]);

  // TODO: Add an option to encrypt with a password

  return (
    <Card
      headerText="Export your wallet"
      subtitle="Download your keyfile or copy your seedphrase to export your wallet."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => {
        window.history.back();
      }}
      size="auto">
      <Box>
        <Snackbar variant="warning">Do not share this with anyone.</Snackbar>
        <Copyable
          style={{ margin: "32px 0" }}
          isFullWidth
          label="Your wallet address"
          onClick={() => {
            return copy(walletAddress);
          }}
          value={walletAddress}
        />
        <Button onClick={() => downloadKeyfile()} variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />}>
          Export keyfile
        </Button>
        <Button
          onClick={() => copySeedphrase()}
          variant="outlined"
          isFullWidth
          isDisabled={!hasEncryptedSeedPhrase}
          icon={<SeedIcon fontSize={24} />}>
          Copy seedphrase
        </Button>
      </Box>
    </Card>
  );
}
