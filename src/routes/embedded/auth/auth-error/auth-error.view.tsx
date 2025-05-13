import { Button, Text, ErrorIcon } from "~components/embed";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";
import { useSearchParams } from "~wallets/router/router.utils";
import { useEffect, useMemo } from "react";
import { getFriendlyErrorMessage } from "~routes/embedded/auth/auth-error/auth-error.utils";

export default function AuthErrorEmbeddedView() {
  const searchParams = useSearchParams<{
    error: string;
    error_description: string;
  }>();

  const {
    errorCode,
    errorDescription,
    friendlyErrorMessage,
  } = useMemo(() => {
    const errorCode = searchParams.error || "unknown_error";
    const errorDescription = searchParams.error_description || "";
    const friendlyErrorMessage = getFriendlyErrorMessage(errorCode, errorDescription);

    return {
      errorCode,
      errorDescription,
      friendlyErrorMessage,
    };
  }, [searchParams])


  const handleReload = () => {
    location.href = "/";
  }

  useEffect(() => {
    if (!errorCode || !errorDescription) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No error or error_description search param. The router should have taken care of this.")
      } else {
        handleReload();
      }
    }
  }, [errorCode, errorDescription]);

  // TODO: Instead of reload, should we just show a close option?

  return (
    <OnboardingCard
      headerIcon={<ErrorIcon fontSize={42} />}
      headerText="Authentication Failed"
      subtitle={ friendlyErrorMessage }
      hasBackButton={false}
      // No close button because this page is rendered in a popup window, not embedded (usually):
      hasCloseButton={false}>

      <Button isFullWidth variant="primary" onClick={handleReload}>
        Reload Wander
      </Button>

      <Text variant="bodyXs" style={{ textAlign: "center", marginTop: 16 }}>
        If you continue to experience issues, please try:
      </Text>

      <ul style={{ listStyleType: "disc", paddingLeft: 20, margin: 0 }}>
        <li>
          <Text variant="bodyXs">Clearing your browser cache.</Text>
        </li>
        <li>
          <Text variant="bodyXs">Using a different authentication method.</Text>
        </li>
        <li>
          <Text variant="bodyXs">Contacting support with error code: {errorCode}.</Text>
        </li>
      </ul>
    </OnboardingCard>
  );
}
