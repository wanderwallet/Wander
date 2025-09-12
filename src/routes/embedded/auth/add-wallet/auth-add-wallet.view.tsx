import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { Button, SeedIcon, WalletIcon } from "~components/embed";
import type { WalletSourceType } from "embed-api";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { signOut } from "~utils/embedded/embedded.utils";
import { navigate } from "wouter/use-hash-location";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { toast } from "react-toastify";

export function AuthAddWalletEmbeddedView() {
  const { generateTempWallet, registerWallet, authStatus } = useEmbedded();

  // Loading state:

  const [isLoading, setIsLoading] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isLoading;

  const isViewLoading = areButtonsDisabled;

  useEffect(() => {
    // Pre-generation starts on app load, but this call will re-generate it again if it has expired, as we are trying to
    // prevent a user accessing a site with Wander Embedded, not creating an account, and coming back way later after
    // the pregenerated wallet has been sitting in memory for long:
    generateTempWallet();
  }, []);

  const handleRegisterWallet = useCallback(async (source: WalletSourceType) => {
    try {
      setIsLoading(true);
      await registerWallet(source);
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error happened.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <OnboardingCard
      headerText={authStatus === "noWallets" ? "Add a Wallet" : "Restore Wallet"}
      subtitle="Create or add an existing wallet that will hold your funds."
      onBackButtonClick={() =>
        authStatus === "noWallets" ? signOut(false) : navigate(EmbeddedPaths.AuthRestoreShares)
      }
      isLoading={isViewLoading}>
      <Button
        onClick={() => handleRegisterWallet("GENERATED")}
        variant="outlined"
        isFullWidth
        icon={<WalletIcon fontSize={24} />}
        isDisabled={areButtonsDisabled}>
        Create new wallet
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<SeedIcon fontSize={24} />}
        href="/auth/import-wallet"
        isDisabled={areButtonsDisabled}>
        Import wallet
      </Button>

      {/* {authProviderType === "PASSKEYS" ? (
        <Button
          variant="outlined"
          isFullWidth
          icon={<QRCodeIcon fontSize={24} />}
          href="/auth/add-device"
          isDisabled={areButtonsDisabled}
        >
          Scan QR Code
        </Button>
      ) : (
        <Button
          variant="outlined"
          isFullWidth
          icon={<QRCodeIcon fontSize={24} />}
          href="/auth/add-auth-provider"
          isDisabled={areButtonsDisabled}
        >
          Add {(authProviderType || "UNKNOWN").toLocaleUpperCase()} to an
          existing account
        </Button>
      )} */}
    </OnboardingCard>
  );
}
