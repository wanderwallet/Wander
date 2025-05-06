import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";

import { Box, Button, Card, KeyIcon, QRCodeIcon, SeedIcon, WalletIcon, WanderFooter } from "~components/embed";
import type { WalletSourceType } from "embed-api";

export function AuthAddWalletEmbeddedView() {
  const { authProviderType, generateTempWallet, registerWallet } = useEmbedded();
  const { navigate } = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Pre-generation starts on app load, but this call will re-generate it again if it has expired, as we are trying to
    // prevent a user accessing a site with Wander Embedded, not creating an account, and coming back way later after
    // the pregenerated wallet has been sitting in memory for long:
    generateTempWallet();
  }, []);

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const handleRegisterWallet = useCallback(async (source: WalletSourceType) => {
    setIsLoading(true);
    await registerWallet(source);
    setIsLoading(false);
  }, []);

  return (
    <Card
      headerText="Add a wallet"
      subtitle="Add a wallet to your account to hold your funds. Create or add an existing wallet to continue."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate(`/wallet`)}
      size="auto">
      <Box>
        <Button
          onClick={() => handleRegisterWallet("GENERATED")}
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
          isLoading={isLoading}
          isDisabled={isLoading}>
          Create new wallet
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<WalletIcon fontSize={24} />}
          href="#/auth/import-seedphrase"
          isDisabled={isLoading}>
          Enter Seed Phrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          href="#/auth/import-keyfile"
          isDisabled={isLoading}>
          Import Keyfile
        </Button>
        {/* {authProviderType === "PASSKEYS" ? (
          <Button
            variant="outlined"
            isFullWidth
            icon={<QRCodeIcon fontSize={24} />}
            href="#/auth/add-device"
            isDisabled={isLoading}
          >
            Scan QR Code
          </Button>
        ) : (
          <Button
            variant="outlined"
            isFullWidth
            icon={<QRCodeIcon fontSize={24} />}
            href="#/auth/add-auth-provider"
            isDisabled={isLoading}
          >
            Add {(authProviderType || "UNKNOWN").toLocaleUpperCase()} to an
            existing account
          </Button>
        )} */}
      </Box>
    </Card>
  );
}
