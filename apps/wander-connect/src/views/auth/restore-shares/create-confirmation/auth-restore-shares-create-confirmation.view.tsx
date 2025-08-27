import { Button, WalletIcon, Snackbar, OnboardingCard } from "@wanderapp/ui";
import browser from "webextension-polyfill";
import { useLocation } from "@wanderapp/core";
import { EmbeddedPaths } from "../../../../router/dashboard/iframe.routes";

export function AuthRestoreSharesCreateConfirmationEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <OnboardingCard
      headerText="Restore Wallet"
      subtitle="Are you sure you want to create a new wallet?"
      onBackButtonClick={() => navigate(EmbeddedPaths.AuthRestoreShares)}>
      <Snackbar title="Your old wallet will be replaced" variant="warning">
        <p>You won't be able to access your old wallet again.</p>
        <p>
          Need help?{" "}
          <Button
            variant="link"
            onClick={(e) => {
              e.preventDefault();
              browser.tabs.create({ url: "https://www.wander.app/help" });
            }}>
            {" "}
            Learn more
          </Button>
        </p>
      </Snackbar>

      <Button variant="primary" isFullWidth icon={<WalletIcon fontSize={24} />} href={EmbeddedPaths.AuthAddWallet}>
        Yes, create
      </Button>

      <Button variant="outlined" isFullWidth href={EmbeddedPaths.AuthRecoverAccount}>
        No, cancel
      </Button>
    </OnboardingCard>
  );
}
