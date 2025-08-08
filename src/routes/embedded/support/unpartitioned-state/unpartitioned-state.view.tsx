import { useEmbedded } from "~utils/embedded/embedded.hooks";
import React, { useCallback, useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { Button, Checkbox, Snackbar } from "~components/embed";
import { LocalStorage } from "~iframe/storage/unpartitioned-storage/local-storage";
import { Image } from "~components/common/Image/Image";
import { toast } from "react-toastify";
import { FormattedText } from "~components/embed/ui/atoms/formatted-text/FormattedText";
import { useInterval } from "@swyg/corre";
import { HAS_ADVANCED_STORAGE_API } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";

import chromeLogoSrc from "url:assets/icons/browsers/chrome-logo.png";
import edgeLogoSrc from "url:assets/icons/browsers/edge-logo.png";
import operaLogoSrc from "url:assets/icons/browsers/opera-logo.png";
import braveLogoSrc from "url:assets/icons/browsers/brave-logo.png";
import safariLogoSrc from "url:assets/icons/browsers/safari-logo.png";
import firefoxLogoSrc from "url:assets/icons/browsers/firefox-logo.png";

import brave1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/brave-1-light.png";
import brave2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/brave-2-light.png";
import brave1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/brave-1-dark.png";
import brave2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/brave-2-dark.png";

import chrome1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-1-light.png";
import chrome2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-2-light.png";
import chrome3ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-3-light.png";
import chrome1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-1-dark.png";
import chrome2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-2-dark.png";
import chrome3ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-3-dark.png";

import inApp1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/in-app-1-light.png";
import inApp2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/in-app-2-light.png";
import inApp1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/in-app-1-dark.png";
import inApp2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/in-app-2-dark.png";

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

  const couldProbablyGetAccess =
    (HAS_ADVANCED_STORAGE_API && (unpartitionedStateStatus === "rejected" || unpartitionedStateStatus === "error")) ||
    isPretendingToBeAnotherBrowser;

  const shouldTryToGetAccess = authStatus === "noAuth" && couldProbablyGetAccess;

  // Loading state:

  const [isConfirming, setIsConfirming] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isConfirming;
  const areButtonsDisabled = isViewLoading || isRequestingPermission;

  // Checkbox and error handling:

  const [isChecked, setIsChecked] = useState(false);
  const [errorsWhileRequestingAccess, setErrorsWhileRequestingAccess] = useState(0);

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
      setIsRequestingPermission(true);

      const localStorage = await LocalStorage.getInstance();

      console.log("localStorage =", localStorage);

      if (["rejected", "error"].includes(localStorage.status))
        throw new Error(`Unpartitioned state status = "${localStorage.status}"`);

      navigate(EmbeddedPaths.Auth);
    } catch (error) {
      // Brave throws a "NotAllowedError" error while trying to request access, even after a user interaction...
      toast.error("Unexpected error. Please, try again.");
      setErrorsWhileRequestingAccess((prevErrorsWhileRequestingAccess) => prevErrorsWhileRequestingAccess + 1);
      setIsRequestingPermission(false);
    }
  }, [navigate]);

  useInterval(
    async () => {
      if (isRequestingPermission) return;

      const hasAccess = await document.hasStorageAccess();

      if (hasAccess) {
        const localStorage = await LocalStorage.getInstance();

        if (!["rejected", "error"].includes(localStorage.status)) {
          setIsRequestingPermission(true);
          navigate(EmbeddedPaths.Auth);
        }
      }
    },
    shouldTryToGetAccess ? 1000 : null,
  );

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

      {couldProbablyGetAccess ? (
        <Snackbar
          variant="warning"
          children="Your browser should be supported, but we could not access the browser's storage. Please, log out to try again."
          className={styles.couldProbablyGetAccessDisclaimer}
        />
      ) : null}
    </>
  );

  if (shouldTryToGetAccess) {
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
            <p key="image1">
              <Image
                fullWidth
                src={brave1ScreenshotSrc}
                srcDark={brave1ScreenshotDarkSrc}
                width={867}
                height={144}
                border
                borderRadius="rounded"
                pointer={[61.07954545454545, 48.275862068965516]}
              />
            </p>,
            <p key="image2">
              <Image
                fullWidth
                src={brave2ScreenshotSrc}
                srcDark={brave2ScreenshotDarkSrc}
                width={867}
                height={822}
                border
                borderRadius="rounded"
                pointer={[85.43857142857143, 70.18072289156626]}
              />
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
              <Image
                fullWidth
                src={chrome1ScreenshotSrc}
                srcDark={chrome1ScreenshotDarkSrc}
                width={1080}
                height={147}
                border
                borderRadius="rounded"
                pointer={[15.340909090909092, 50]}
              />
            </p>,
            <p key="image2">
              <Image
                fullWidth
                src={chrome2ScreenshotSrc}
                srcDark={chrome2ScreenshotDarkSrc}
                width={1080}
                height={656}
                border
                borderRadius="rounded"
                pointer={[8.65, 51.86915887850467]}
              />
            </p>,
            <p key="image3">
              <Image
                fullWidth
                src={chrome3ScreenshotSrc}
                srcDark={chrome3ScreenshotDarkSrc}
                width={1080}
                height={1106}
                border
                borderRadius="rounded"
                pointer={[87.7840909090909, 86.94444444444444]}
              />
            </p>,
          ]}
        />
      );
    } else if (isInAppAndroidBrowser) {
      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text">You'll have to switch to your browser app to enable this:</p>,
            <p key="image1">
              <Image
                fullWidth
                src={inApp1ScreenshotSrc}
                srcDark={inApp1ScreenshotDarkSrc}
                width={1080}
                height={147}
                border
                borderRadius="rounded"
                pointer={[93.1, 50]}
              />
            </p>,
            <p key="image2">
              <Image
                fullWidth
                src={inApp2ScreenshotSrc}
                srcDark={inApp2ScreenshotDarkSrc}
                width={1080}
                height={1326}
                border
                borderRadius="rounded"
                pointer={[56, 83.9907192575406]}
              />
            </p>,
          ]}
        />
      );
    }

    children = (
      <>
        {browserSpecificInstructions}

        <Button
          variant="primary"
          size="md"
          isDisabled={areButtonsDisabled}
          isLoading={isRequestingPermission}
          onClick={handleRequestPermission}>
          {requestAccessButtonText}
        </Button>

        {errorsWhileRequestingAccess >= 3 && needsConfirmation ? (
          <Button variant="secondary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
            Continue anyway
          </Button>
        ) : null}
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
