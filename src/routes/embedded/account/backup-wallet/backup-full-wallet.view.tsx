import { Key01, PasscodeLock } from "@untitled-ui/icons-react";
import copy from "copy-to-clipboard";
import { useState, useEffect } from "react";
import { Flex } from "~components/common/Flex";
import { Button, Copyable, Snackbar, CheckIcon } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { Link } from "~wallets/router/components/link/Link";
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
    <OnboardingCard
      headerText="Export wallet"
      subtitle="Download your keyfile or copy your seedphrase to export your account."
      onBackButtonClick={() => navigate("/account/backup-wallet")}>
      <Snackbar variant="info" title="About this file:">
        <Flex direction="row" gap={8} align="center">
          <CheckIcon style={{ flexShrink: 0, color: "#22c55e" }} height={17} width={17} />
          This file can be used to import your wallet into other wallet apps.
        </Flex>

        <Flex direction="row" gap={8} align="center">
          <CheckIcon style={{ flexShrink: 0, color: "#22c55e" }} height={17} width={17} />
          This file can be used to recover your account if you lose access to your credentials.
        </Flex>
      </Snackbar>

      <Snackbar variant="warning" title="Do not share this with anyone!">
        <p>Anyone with access to this file can access your wallet and funds, even without authenticating.</p>
        <strong>
          Download a safer <Link to="/account/backup-wallet/recovery-file">recovery file</Link> instead.
        </strong>
      </Snackbar>

      <Copyable
        style={{ padding: "0" }}
        isFullWidth
        label="Your wallet address"
        value={currentWallet.address}
        onClick={() => {
          copy(currentWallet.address);
        }}
      />

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
    </OnboardingCard>
  );
}
