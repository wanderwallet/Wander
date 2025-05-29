import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button, Text } from "~components/embed";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AuthEmailSigninEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus, authenticate } = useEmbedded();

  // Input refs:

  const passwordInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;

  const isViewLoading = areButtonsDisabled;

  // Handlers:

  /*
  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !authEmail ||
    !passwordInput.state;
  */

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const password = passwordInputRef.current?.value || "";

        if (!password) {
          toast.error("Please enter an email and password");
          return;
        }

        setIsAuthenticating(true);

        await authenticate({
          method: "signInWithPassword",
          email,
          password,
        });

        // navigate(EmbeddedPaths.WalletHomeEmbeddedView);
      } catch (error) {
        if (error.code === "email_not_confirmed") {
          navigate(EmbeddedPaths.AuthEmailVerify);
        } else {
          toast.error(error.message || "Error signing up");
        }
      } finally {
        setIsAuthenticating(false);
      }
    },
    [email],
  );

  useEffect(() => {
    if (!email) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No email search param. The router should have taken care of this.");
      } else {
        navigate(EmbeddedPaths.Auth);
      }
    }
  }, [email]);

  return (
    <OnboardingCard
      headerText="Enter your password"
      isLoading={isViewLoading}
      onBackButtonClick={() => navigate(`/auth`)}
      onSubmit={handleEmailSignIn}>
      <PasswordInput
        name="password"
        placeholder="Enter your password"
        inputRef={passwordInputRef}
        disabled={areButtonsDisabled}
        autoFocus
      />

      <Button type="submit" isFullWidth isDisabled={areButtonsDisabled}>
        Sign in
      </Button>

      <Flex direction="row" gap={4} width="100%" justify="center">
        <Text variant={"bodySm"} alignment="left">
          Forgot your password?
        </Text>

        <Button
          style={{ width: "auto" }}
          variant="link"
          alignment="left"
          isFullWidth
          isDisabled={areButtonsDisabled}
          href={EmbeddedPaths.AuthRecoverAccount}>
          Recover account
        </Button>
      </Flex>
    </OnboardingCard>
  );
}
