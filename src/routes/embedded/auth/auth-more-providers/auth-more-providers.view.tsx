import { useEmbedded } from "~utils/embedded/embedded.hooks";

import { AppleIcon, Button, FacebookIcon, TwitterIcon } from "~components/embed";
import { useCallback, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AuthMoreProvidersEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate, authStatus, recoverableAccount } = useEmbedded();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;

  const isViewLoading = areButtonsDisabled;

  // Handlers:

  const handleAuthenticate = useCallback(async (authProviderType: AuthProviderType) => {
    try {
      setIsAuthenticating(true);
      await authenticate(authProviderType);
    } catch (error) {
      toast.error(`Error signing in with ${authProviderType}`);
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
