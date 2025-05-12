import { useEmbedded } from "~utils/embedded/embedded.hooks";

import { AppleIcon, Box, Button, Card, FacebookIcon, TwitterIcon, WanderFooter } from "~components/embed";
import { useCallback, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";

export function AuthMoreProvidersEmbeddedView() {
  const { back } = useLocation();
  const { authenticate, authStatus } = useEmbedded();

  const [selectedAuthProviderType, setSelectedAuthProviderType] = useState<AuthProviderType | null>(null);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || !!selectedAuthProviderType;

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const handleAuthenticate = useCallback(async (authProviderType: AuthProviderType) => {
    try {
      setSelectedAuthProviderType(authProviderType);
      await authenticate(authProviderType);
    } catch (error) {
      toast.error(`Error signing in with ${authProviderType}`);
    } finally {
      setSelectedAuthProviderType(null);
    }
  }, []);

  return (
    <Card
      headerText="Sign up or Sign in"
      subtitle="Select a method to authenticate"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto">
      <Box>
        <Button
          variant="outlined"
          isFullWidth
          icon={<FacebookIcon fontSize={24} />}
          onClick={() => handleAuthenticate("FACEBOOK")}
          isLoading={selectedAuthProviderType === "FACEBOOK"}
          isDisabled={areButtonsDisabled}>
          Continue with Facebook
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          onClick={() => handleAuthenticate("APPLE")}
          isLoading={selectedAuthProviderType === "APPLE"}
          isDisabled={areButtonsDisabled}>
          Continue with Apple
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<TwitterIcon fontSize={24} />}
          onClick={() => handleAuthenticate("X")}
          isLoading={selectedAuthProviderType === "X"}
          isDisabled={areButtonsDisabled}>
          Continue with X
        </Button>
      </Box>
    </Card>
  );
}
