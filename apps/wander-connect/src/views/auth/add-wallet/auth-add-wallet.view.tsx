import { useEmbedded } from "../../../utils/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { Button, KeyIcon, SeedIcon, WalletIcon, OnboardingCard } from "@wanderapp/ui";
import type { WalletSourceType } from "embed-api";
import { QrCode02 } from "@untitled-ui/icons-react";
import { navigate } from "wouter/use-hash-location";
import { toast } from "react-toastify";
import { EmbeddedPaths } from "../../../router/dashboard/iframe.routes";
import { signOut } from "../../../utils/embedded.utils";

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
      subtitle="Add a wallet to your account to hold your funds. Create or add an existing wallet to continue."
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
        href="/auth/import-seedphrase"
        isDisabled={areButtonsDisabled}>
        Enter Seed Phrase
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<KeyIcon fontSize={24} />}
        href="/auth/import-keyfile"
        isDisabled={areButtonsDisabled}>
        Import Keyfile
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<QrCode02 fontSize={24} color="currentColor" />}
        href="/auth/import-qrcode"
        isDisabled={areButtonsDisabled}>
        Scan QR Code
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
