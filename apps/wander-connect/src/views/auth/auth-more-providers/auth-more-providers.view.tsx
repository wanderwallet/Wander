import { AppleIcon, Button, FacebookIcon, TwitterIcon, OnboardingCard } from "@wanderapp/ui";
import { useCallback, useState } from "react";
import { useLocation } from "@wanderapp/core";
import { toast } from "react-toastify";
import { getFriendlyAuthErrorMessage } from "../../../domains/authentication/authentication.utils";
import { useEmbedded } from "../../../utils/embedded.hooks";
import { OAutProviderType } from "../../../utils/embedded.types";

export function AuthMoreProvidersEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate, authStatus, recoverableAccount } = useEmbedded();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;

  const isViewLoading = areButtonsDisabled;

  // Handlers:

  const handleAuthenticate = useCallback(async (authProviderType: OAutProviderType) => {
    try {
      setIsAuthenticating(true);
      await authenticate(authProviderType);
    } catch (error) {
      toast.error(getFriendlyAuthErrorMessage(error, `Error signing in with ${authProviderType}`));
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  return (
    <OnboardingCard
      headerText={recoverableAccount ? "Select new sign in method" : "Sign up or Sign in"}
      subtitle="Select a method to authenticate"
      onBackButtonClick={() => navigate(`/auth`)}
      isLoading={isViewLoading}>
      <Button
        variant="outlined"
        isFullWidth
        icon={<FacebookIcon fontSize={24} />}
        onClick={() => handleAuthenticate("FACEBOOK")}
        isDisabled={areButtonsDisabled}>
        Continue with Facebook
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<AppleIcon fontSize={24} />}
        onClick={() => handleAuthenticate("APPLE")}
        isDisabled={areButtonsDisabled}>
        Continue with Apple
      </Button>

      <Button
        variant="outlined"
        isFullWidth
        icon={<TwitterIcon fontSize={24} />}
        onClick={() => handleAuthenticate("X")}
        isDisabled={areButtonsDisabled}>
        Continue with X
      </Button>
    </OnboardingCard>
  );
}
