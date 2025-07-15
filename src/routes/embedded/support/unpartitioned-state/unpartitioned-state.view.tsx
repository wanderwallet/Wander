import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { Button, Checkbox } from "~components/embed";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";

export function UnpartitionedStateMissingEmbeddedView() {
  const { navigate } = useLocation();
  const { authStatus, unpartitionedStateStatus, unpartitionedStateConfirmed, confirmUnpartitionedState } =
    useEmbedded();

  // TODO: Style list.

  // TODO: Change footer messaging and move to top. Remove warning icon from wallet dashboard.

  // TODO: Do not show this view if authenticating

  // TODO: Count errors and, if 3, change to "not supported"

  const [isChecked, setIsChecked] = useState(false);

  // Loading state:

  const [isConfirming, setIsConfirming] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isConfirming;

  const isViewLoading = areButtonsDisabled;

  // Handlers:

  const handleContinueAnyway = useCallback(async () => {
    try {
      setIsConfirming(true);
      await confirmUnpartitionedState(false);
      navigate(EmbeddedPaths.Auth);
    } catch (error) {
      // TODO: Add toast
      setIsConfirming(false);
    }
  }, [confirmUnpartitionedState, navigate]);

  const handleRequestPermission = useCallback(async () => {
    try {
      await LocalStorage.getInstance();
      navigate(EmbeddedPaths.Auth);
    } catch (error) {
      if (error.name === "NotAllowedError") {
      }
      // TODO: Add toast
      // toast.error(getFriendlyAuthErrorMessage(error, `Error signing in with ${authProviderType}`));
    }
  }, [navigate]);

  useEffect(() => {
    if (unpartitionedStateStatus === "supported" || unpartitionedStateConfirmed) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("This view should not be accessible if unpartitioned state is supported and accepted.");
      } else {
        navigate(EmbeddedPaths.Auth);
      }
    }
  }, [unpartitionedStateStatus]);

  let headerText = "Limited browser support";
  let subtitle =
    "Your browser doesn't support cross-site authentication and wallet syncing. You'll need to manually import your wallet on each new site.";
  let children = (
    <>
      <dl>
        <dt>Fully supported</dt>
        <dd>
          <ul>
            <li>Chrome</li>
            <li>Edge</li>
            <li>Brave</li>
          </ul>
        </dd>
        <dt>Limited support</dt>
        <dd>
          <ul>
            <li>Safari</li>
            <li>Firefox</li>
          </ul>
        </dd>
      </dl>

      <Checkbox
        style={{ padding: 0, margin: 0 }}
        label="Don't show me this again on this site."
        isDisabled={areButtonsDisabled}
        handleChange={() => setIsChecked(!isChecked)}
        isChecked={isChecked}
      />

      <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
        Continue anyway
      </Button>
    </>
  );

  if (unpartitionedStateStatus === "rejected" || unpartitionedStateStatus === "error") {
    if (unpartitionedStateStatus === "rejected") {
      headerText = "Enable browser storage support";
    } else {
      headerText = "Error accessing browser storage";
    }

    subtitle =
      "Before you continue, Wander Connect needs access to your browser's storage to enalbe cross-site authentication and wallet synching.";

    children = (
      <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleRequestPermission}>
        {unpartitionedStateStatus === "rejected" ? "Request access" : "Try again"}
      </Button>
    );
  }

  return (
    <OnboardingCard headerText={headerText} subtitle={subtitle} hasBackButton={false} isLoading={isViewLoading}>
      {children}
    </OnboardingCard>
  );
}
