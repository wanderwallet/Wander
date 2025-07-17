import { useEmbedded } from "~utils/embedded/embedded.hooks";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { Button, Checkbox } from "~components/embed";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import Image from "~components/common/Image";
import { toast } from "react-toastify";
import { FormattedText } from "~components/embed/ui/atoms/formatted-text/FormattedText";

import chromeLogoSrc from "url:assets/icons/browsers/chrome-logo.png";
import edgeLogoSrc from "url:assets/icons/browsers/edge-logo.png";
import operaLogoSrc from "url:assets/icons/browsers/opera-logo.png";
import braveLogoSrc from "url:assets/icons/browsers/brave-logo.png";
import safariLogoSrc from "url:assets/icons/browsers/safari-logo.png";
import firefoxLogoSrc from "url:assets/icons/browsers/firefox-logo.png";
import braveScreenshotSrc from "url:assets/screenshots/unpartitioned-state/raw-brave-dark.png";
import chrome1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/raw-chrome-1-dark.png";
import chrome2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/raw-chrome-2-dark.png";
import chrome3ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/raw-chrome-3-dark.png";
import inAppScreenshotSrc from "url:assets/screenshots/unpartitioned-state/raw-in-app-dark.png";

import styles from "./unpartitioned-state.module.scss";

const pretendToBeBrave = false;
const isBrave = pretendToBeBrave || window.navigator.brave;

const pretendToBeMobileChrome = false;
const isMobileChrome = pretendToBeMobileChrome || false;

const pretendToBeInAppAndroidBrowser = false;
const isInAppAndroidBrowser =
  pretendToBeInAppAndroidBrowser ||
  (navigator.userAgent.includes("Android") &&
    (navigator.userAgent.includes("wv") || navigator.userAgent.includes("WebView")));

// Note this flags are only useful to see the UI in those browsers, but not to reproduce their exact behavior.
const isPretendingToBeAnotherBrowser = pretendToBeBrave || pretendToBeMobileChrome || pretendToBeInAppAndroidBrowser;

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
      const localStorage = await LocalStorage.getInstance();

      console.log("COULD CONTINUE", localStorage.status);

      if (["rejected", "error"].includes(localStorage.status))
        throw new Error(`Unpartitioned state status = "${localStorage.status}"`);

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
  const requestAccessButtonText =
    unpartitionedStateStatus === "rejected" || errorsWhileRequestingAccess === 0 ? "Request access" : "Try again";

  let headerText = "Limited browser support";
  let subtitle =
    "Your browser doesn't support cross-site authentication and wallet syncing. You'll need to manually import your wallet on each new site.";

  // Logos downloaded from https://github.com/alrra/browser-logos

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
              <Image width={18} height={18} src={operaLogoSrc} />
              Opera
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
        <Checkbox
          style={{ padding: 0, margin: "var(--spacing-3) 0" }}
          label="Don't show me this again on this site."
          isDisabled={areButtonsDisabled}
          handleChange={() => setIsChecked(!isChecked)}
          isChecked={isChecked}
        />
      ) : null}

      {authStatus === "noAuth" && unpartitionedStateConfirmed ? (
        <Button variant="secondary" size="md" isDisabled={areButtonsDisabled} onClick={handleRequestPermission}>
          {requestAccessButtonText}
        </Button>
      ) : null}

      {unpartitionedStateConfirmed ? null : errorsWhileRequestingAccess > 0 ? (
        <>
          <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleRequestPermission}>
            {requestAccessButtonText}
          </Button>

          <Button variant="secondary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
            Continue anyway
          </Button>
        </>
      ) : (
        <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
          Continue anyway
        </Button>
      )}
    </>
  );

  console.log("errorsWhileRequestingAccess =", errorsWhileRequestingAccess);

  if (
    authStatus === "noAuth" &&
    errorsWhileRequestingAccess < 3 &&
    (unpartitionedStateStatus === "rejected" || unpartitionedStateStatus === "error" || isPretendingToBeAnotherBrowser)
  ) {
    if (errorsWhileRequestingAccess === 0 || unpartitionedStateStatus === "rejected") {
      headerText = "Enable browser storage support";
    } else {
      headerText = "Error accessing browser storage";
    }

    subtitle =
      "Before you continue, Wander Connect needs access to your browser's storage to enable cross-site authentication and wallet synching.";

    let browserSpecificInstructions: React.ReactNode = null;

    if (isBrave) {
      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text">
              You can enable this from the <em className={styles.inlineQuote}>Embedded content</em> option in the
              navigation bar:
            </p>,
            <p key="image">
              <Image src={braveScreenshotSrc} borderRadius={8} />
            </p>,
          ]}
        />
      );
    } else if (isMobileChrome) {
      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text">
              You can enable this from the <em className={styles.inlineQuote}>Cookies and site data</em> option in the
              navigation bar:
            </p>,
            <p key="image1">
              <Image src={chrome1ScreenshotSrc} borderRadius={8} />
            </p>,
            <p key="image2">
              <Image src={chrome2ScreenshotSrc} borderRadius={8} />
            </p>,
            <p key="image3">
              <Image src={chrome3ScreenshotSrc} borderRadius={8} />
            </p>,
          ]}
        />
      );
    } else if (isInAppAndroidBrowser) {
      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text">You'll have to switch to your browser app to enable this:</p>,
            <p key="image">
              <Image src={inAppScreenshotSrc} borderRadius={8} />
            </p>,
          ]}
        />
      );
    }

    children = (
      <>
        {browserSpecificInstructions}

        <Button variant="primary" size="md" isDisabled={areButtonsDisabled} onClick={handleRequestPermission}>
          {requestAccessButtonText}
        </Button>
      </>
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
