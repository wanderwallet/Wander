import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { Button, Checkbox } from "~components/embed";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import chromeLogoSrc from "url:assets/icons/browsers/chrome-logo.png";
import edgeLogoSrc from "url:assets/icons/browsers/edge-logo.png";
import braveLogoSrc from "url:assets/icons/browsers/brave-logo.png";
import safariLogoSrc from "url:assets/icons/browsers/safari-logo.png";
import firefoxLogoSrc from "url:assets/icons/browsers/firefox-logo.png";
import Image from "~components/common/Image";

import styles from "./unpartitioned-state.module.scss";
import { toast } from "react-toastify";

export function UnpartitionedStateMissingEmbeddedView() {
  const { navigate } = useLocation();
  const { authStatus, unpartitionedStateStatus, unpartitionedStateConfirmed, confirmUnpartitionedState } =
    useEmbedded();

  // Checkbox and error handling:

  const [isChecked, setIsChecked] = useState(false);
  const [errorsWhileRequestingAccess, setErrorsWhileRequestingAccess] = useState(0);

  // Loading state:

  const [isConfirming, setIsConfirming] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isConfirming;

  const isViewLoading = areButtonsDisabled;

  // Handlers:

  const handleContinueAnyway = useCallback(async () => {
    try {
      setIsConfirming(true);
      await confirmUnpartitionedState(isChecked);
      navigate(EmbeddedPaths.Auth);
    } catch (error) {
      toast.error("Unexpected error. Please, try again.");
      setIsConfirming(false);
    }
  }, [confirmUnpartitionedState, isChecked, navigate]);

  const handleRequestPermission = useCallback(async () => {
    try {
      await LocalStorage.getInstance();
      console.log("COULD CONTINUE");
      navigate(EmbeddedPaths.Auth);
    } catch (error) {
      console.log(error);

      // Brave throws a "NotAllowedError" error while trying to request access, even after a user interaction...

      toast.error("Unexpected error. Please, try again.");
      setErrorsWhileRequestingAccess((prevErrorsWhileRequestingAccess) => prevErrorsWhileRequestingAccess + 1);
    }
  }, [navigate]);

  useEffect(() => {
    if (unpartitionedStateStatus === "supported") {
      if (process.env.NODE_ENV === "development") {
        throw new Error("This view should not be accessible if unpartitioned state is supported and accepted.");
      } else {
        navigate(EmbeddedPaths.Auth);
      }
    }
  }, [unpartitionedStateStatus]);

  const needsConfirmation = !unpartitionedStateConfirmed && authStatus === "noAuth";

  let headerText = "Limited browser support";
  let subtitle =
    "Your browser doesn't support cross-site authentication and wallet syncing. You'll need to manually import your wallet on each new site.";

  // TODO: Consider adding Opera and some mobile browsers (maybe only if detected):

  let children = (
    <>
      <dl className={styles.supportList}>
        <dt className={styles.fullySupportedLabel}>Fully supported</dt>
        <dd className={styles.supportGroup}>
          <ul className={styles.browserList}>
            <li className={styles.browserItem}>
              <Image width={18} height={18} src={chromeLogoSrc} />
              Chrome
            </li>
            <li className={styles.browserItem}>
              <Image width={18} height={18} src={edgeLogoSrc} />
              Edge
            </li>
            <li className={styles.browserItem}>
              <Image width={18} height={18} src={braveLogoSrc} />
              Brave
            </li>
          </ul>
        </dd>
        <dt className={styles.limitedSupportLabel}>Limited support</dt>
        <dd className={styles.supportGroup}>
          <ul className={styles.browserList}>
            <li className={styles.browserItem}>
              <Image width={18} height={18} src={safariLogoSrc} />
              Safari
            </li>
            <li className={styles.browserItem}>
              <Image width={18} height={18} src={firefoxLogoSrc} />
              Firefox
            </li>
          </ul>
        </dd>
      </dl>

      {needsConfirmation ? (
        <>
          <Checkbox
            style={{ padding: 0, margin: "var(--spacing-3) 0" }}
            label="Don't show me this again on this site."
            isDisabled={areButtonsDisabled}
            handleChange={() => setIsChecked(!isChecked)}
            isChecked={isChecked}
          />

          <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
            Continue anyway
          </Button>
        </>
      ) : null}
    </>
  );

  console.log("errorsWhileRequestingAccess =", errorsWhileRequestingAccess);

  if (
    errorsWhileRequestingAccess < 3 &&
    (unpartitionedStateStatus === "rejected" || unpartitionedStateStatus === "error")
  ) {
    if (unpartitionedStateStatus === "rejected") {
      headerText = "Enable browser storage support";
    } else {
      headerText = "Error accessing browser storage";
    }

    subtitle =
      "Before you continue, Wander Connect needs access to your browser's storage to enable cross-site authentication and wallet synching.";

    children = (
      <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleRequestPermission}>
        {unpartitionedStateStatus === "rejected" ? "Request access" : "Try again"}
      </Button>
    );
  }

  return (
    <OnboardingCard
      headerText={headerText}
      subtitle={subtitle}
      hasBackButton={!needsConfirmation}
      isLoading={isViewLoading}>
      {children}
    </OnboardingCard>
  );
}
