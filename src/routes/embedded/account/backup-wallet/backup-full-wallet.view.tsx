import { Key01, PasscodeLock } from "@untitled-ui/icons-react";
import copy from "copy-to-clipboard";
import { useState, useEffect } from "react";
import { Box, Button, Card, WanderFooter, Copyable, WarningIcon, Snackbar } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupFullWalletEmbeddedView() {
  const { navigate } = useLocation();
  const { currentWallet, downloadKeyfile } = useEmbedded();

  const [hasEncryptedSeedPhrase, setHasEncryptedSeedPhrase] = useState(false);

  useEffect(() => {
    WalletUtils.hasEncryptedSeedPhrase(currentWallet.id).then((hasEncryptedSeedPhrase) => {
      setHasEncryptedSeedPhrase(hasEncryptedSeedPhrase);
    });
  }, [currentWallet.id]);

  return (
    <Card
      headerText="Export wallet"
      subtitle="Download your keyfile or copy your seedphrase to export your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/account/backup-wallet")}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate("/wallet")}
      size="auto">
      <Box style={{ gap: 28 }}>
        <Snackbar
          isFullWidth
          icon={<WarningIcon />}
          text="Do not share this with anyone."
          backgroundColor="#FFF9EA"
          borderColor="#F2DC1320"
          textColor="#121212"
          iconColor="#BD8802"
        />
        <Copyable
          style={{ padding: "0" }}
          isFullWidth
          label="Your wallet address"
          value={currentWallet.address}
          onClick={() => {
            copy(currentWallet.address);
          }}
        />
        <Box style={{ padding: 0 }}>
          <Button variant="outlined" isFullWidth icon={<Key01 fontSize={24} />} onClick={downloadKeyfile}>
            Export Keyfile
          </Button>
          {hasEncryptedSeedPhrase && (
            <Button
              variant="outlined"
              isFullWidth
              icon={<PasscodeLock fontSize={24} />}
              onClick={() => navigate("/account/backup-wallet/copy-seedphrase")}>
              Copy Seedphrase
            </Button>
          )}
        </Box>
      </Box>
    </Card>
  );
}
