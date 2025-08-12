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

// Logos downloaded from https://github.com/alrra/browser-logos
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
import chrome4ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-4-light.png";
import chrome5ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-5-light.png";
import chrome1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-1-dark.png";
import chrome2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-2-dark.png";
import chrome3ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-3-dark.png";
import chrome4ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-4-dark.png";
import chrome5ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-5-dark.png";

import chromeAndroid1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-android-1-light.png";
import chromeAndroid2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-android-2-light.png";
import chromeAndroid3ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/chrome-android-3-light.png";
import chromeAndroid1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-android-1-dark.png";
import chromeAndroid2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-android-2-dark.png";
import chromeAndroid3ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/chrome-android-3-dark.png";

import edge1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/edge-1-light.png";
import edge2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/edge-2-light.png";
import edge3ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/edge-3-light.png";
import edge4ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/edge-4-light.png";
import edge5ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/edge-5-light.png";
import edge1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/edge-1-dark.png";
import edge2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/edge-2-dark.png";
import edge3ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/edge-3-dark.png";
import edge4ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/edge-4-dark.png";
import edge5ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/edge-5-dark.png";

import inApp1ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/in-app-1-light.png";
import inApp2ScreenshotSrc from "url:assets/screenshots/unpartitioned-state/in-app-2-light.png";
import inApp1ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/in-app-1-dark.png";
import inApp2ScreenshotDarkSrc from "url:assets/screenshots/unpartitioned-state/in-app-2-dark.png";

import styles from "./unpartitioned-state.module.scss";

const pretendToBeBrave = false;
const isBrave = pretendToBeBrave || window.navigator.brave;

const pretendToBeChrome = false;
const isChrome = pretendToBeChrome;

const pretendToBeEdge = false;
const isEdge = pretendToBeEdge || window.navigator.userAgent.includes("Edg");

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

  console.warn("render unpartitionedStateStatus =", unpartitionedStateStatus);

  // Requesting access logic:

  const [tryAgain, setTryAgain] = useState(false);
  const [isOptionMissing, setIsOptionMissing] = useState(false);

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

      if (!shouldTryToGetAccess || unpartitionedStateConfirmed) navigate(EmbeddedPaths.Auth);
      else setIsConfirming(false);
    } catch (error) {
      toast.error("Unexpected error. Please, try again.");
      setIsConfirming(false);
    }
  }, [unpartitionedStateConfirmed, confirmUnpartitionedState, isChecked, navigate]);

  const handleRequestPermission = useCallback(async () => {
    try {
      setIsRequestingPermission(true);

      console.log("getInstance =");

      const localStorage = await LocalStorage.getInstance();

      console.log("localStorage =", localStorage);

      if (["rejected", "error"].includes(localStorage.status))
        throw new Error(`Unpartitioned state status = "${localStorage.status}"`);

      navigate(EmbeddedPaths.Auth);
    } catch (error) {
      console.log("get instance error =", error);

      // Brave throws a "NotAllowedError" error while trying to request access, even after a user interaction...

      toast.error(
        error instanceof Error &&
          (error.name === "NotAllowedError" || error.message === "Could not get access to unpartitioned state.")
          ? "Could not get access. Did you enable it?"
          : "Unexpected error. Please, try again.",
      );

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
  const requestAccessButtonText = errorsWhileRequestingAccess === 0 ? "Check access" : "Check access again";
  const accessTo = isBrave ? "embedded content" : "third-party cookies";

  let headerText = "Limited browser support";
  let subtitle = couldProbablyGetAccess
    ? `Wander could not get access to ${accessTo}. You'll need to manually import your wallet on each new site.`
    : "Your browser doesn't support cross-site wallet syncing. You'll need to manually import your wallet on each new site.";

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

      {couldProbablyGetAccess ? (
        <Snackbar
          variant="warning"
          children={[
            <p key="text">
              Your browser should be supported, but Wander could not get access to {accessTo}.
              {authStatus === "noAuth" ? "" : " Please, log out to try again."}
            </p>,
            <Button
              key="button"
              variant="link"
              isDisabled={areButtonsDisabled}
              onClick={(e) => {
                e.preventDefault();
                setTryAgain(true);
              }}>
              Try again
            </Button>,
          ]}
          className={styles.couldProbablyGetAccessDisclaimer}
        />
      ) : null}

      {needsConfirmation ? (
        <Checkbox
          style={{ padding: 0, margin: "var(--spacing-3) 0" }}
          label="Don't show me this again on this site."
          isDisabled={areButtonsDisabled}
          handleChange={() => setIsChecked(!isChecked)}
          isChecked={isChecked}
        />
      ) : null}

      <Button variant="secondary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
        Continue without
      </Button>
    </>
  );

  const allowRequestAfterConfirmation = tryAgain && authStatus === "noAuth";

  if (shouldTryToGetAccess && (!unpartitionedStateConfirmed || allowRequestAfterConfirmation)) {
    headerText = `Enable ${accessTo}`;
    subtitle = `Before you continue, Wander Connect needs access to ${accessTo} to enable cross-site authentication and wallet synching.`;

    const optionMissingButton = isOptionMissing ? null : (
      <Button variant="link" onClick={() => setIsOptionMissing(true)}>
        Not there? Try this instead.
      </Button>
    );

    let browserSpecificInstructions: React.ReactNode = null;

    if (isBrave) {
      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text1">
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
            optionMissingButton,
            isOptionMissing ? <p key="text2">Alternatively, turning Shields down should also work.</p> : null,
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
                src={chromeAndroid1ScreenshotSrc}
                srcDark={chromeAndroid1ScreenshotDarkSrc}
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
                src={chromeAndroid2ScreenshotSrc}
                srcDark={chromeAndroid2ScreenshotDarkSrc}
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
                src={chromeAndroid3ScreenshotSrc}
                srcDark={chromeAndroid3ScreenshotDarkSrc}
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
    } else if (isEdge) {
      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text1">
              You can enable this from the <em className={styles.inlineQuote}>Third-party cookies</em> option in the
              navigation bar:
            </p>,
            <p key="image1">
              <Image
                fullWidth
                src={edge1ScreenshotSrc}
                srcDark={edge1ScreenshotDarkSrc}
                width={866}
                height={144}
                border
                borderRadius="rounded"
                pointer={[81.5340909090909, 49.152542372881356]}
              />
            </p>,
            <p key="image2">
              <Image
                fullWidth
                src={edge2ScreenshotSrc}
                srcDark={edge2ScreenshotDarkSrc}
                width={866}
                height={629}
                border
                borderRadius="rounded"
                pointer={[79.82954545454545, 78.90625]}
              />
            </p>,
            optionMissingButton,
            isOptionMissing ? (
              <p key="text2">
                In some Edge versions, this setting appears under the <em className={styles.inlineQuote}>About</em>{" "}
                popup:
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="image3">
                <Image
                  fullWidth
                  src={edge3ScreenshotSrc}
                  srcDark={edge3ScreenshotDarkSrc}
                  width={866}
                  height={144}
                  border
                  borderRadius="rounded"
                  pointer={[8.238636363636363, 49.152542372881356]}
                />
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="image4">
                <Image
                  fullWidth
                  src={edge4ScreenshotSrc}
                  srcDark={edge4ScreenshotDarkSrc}
                  width={1043}
                  height={724}
                  border
                  borderRadius="rounded"
                  pointer={[90.625, 61.885245901639344]}
                />
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="image5">
                <Image
                  fullWidth
                  src={edge5ScreenshotSrc}
                  srcDark={edge5ScreenshotDarkSrc}
                  width={1043}
                  height={724}
                  border
                  borderRadius="rounded"
                  pointer={[90.625, 80.73770491803279]}
                />
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="text3">
                You might also find this option in{" "}
                <em className={styles.inlineQuote}>
                  Settings › Privacy, search, and services › Block third-party cookies
                </em>
                .
              </p>
            ) : null,
          ]}
        />
      );
    } else {
      // Chrome or, most likely, other Chromium-based browser with more or less the same UI (e.g. Opera):

      browserSpecificInstructions = (
        <FormattedText
          children={[
            <p key="text">
              You can enable this from the <em className={styles.inlineQuote}>Third-party cookies</em> option in the
              navigation bar:
            </p>,
            <p key="image1">
              <Image
                fullWidth
                src={chrome1ScreenshotSrc}
                srcDark={chrome1ScreenshotDarkSrc}
                width={874}
                height={149}
                border
                borderRadius="rounded"
                pointer={[80.39772727272727, 51.666666666666664]}
              />
            </p>,
            <p key="image2">
              <Image
                fullWidth
                src={chrome2ScreenshotSrc}
                srcDark={chrome2ScreenshotDarkSrc}
                width={874}
                height={751}
                border
                borderRadius="rounded"
                pointer={[85.51136363636364, 80.4635761589404]}
              />
            </p>,
            optionMissingButton,
            isOptionMissing ? (
              <p key="text2">
                In some {isChrome ? "Chrome versions" : "browsers"}, this setting appears under the{" "}
                <em className={styles.inlineQuote}>Site information</em> popup:
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="image3">
                <Image
                  fullWidth
                  src={chrome3ScreenshotSrc}
                  srcDark={chrome3ScreenshotDarkSrc}
                  width={874}
                  height={149}
                  border
                  borderRadius="rounded"
                  pointer={[8.522727272727273, 50]}
                />
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="image4">
                <Image
                  fullWidth
                  src={chrome4ScreenshotSrc}
                  srcDark={chrome4ScreenshotDarkSrc}
                  width={874}
                  height={852}
                  border
                  borderRadius="rounded"
                  pointer={[86.64772727272727, 48.10495626822158]}
                />
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="image5">
                <Image
                  fullWidth
                  src={chrome5ScreenshotSrc}
                  srcDark={chrome5ScreenshotDarkSrc}
                  width={874}
                  height={1197}
                  border
                  borderRadius="rounded"
                  pointer={[84.6590909090909, 71.78423236514523]}
                />
              </p>
            ) : null,
            isOptionMissing ? (
              <p key="text3">
                You might also find this option in{" "}
                <em className={styles.inlineQuote}>Settings › Privacy and security › Third-party cookies</em>.
              </p>
            ) : null,
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

        {errorsWhileRequestingAccess >= 1 || !needsConfirmation ? (
          <Button variant="secondary" size="md" isDisabled={areButtonsDisabled} onClick={handleContinueAnyway}>
            Continue without
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
