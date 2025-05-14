import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Box, Button, Card, Text, WanderFooter } from "~components/embed";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import PasswordMatch from "~components/welcome/PasswordMatch";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { useThrottledCallback } from "@swyg/corre";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard.module";

export function AuthEmailSignupEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus } = useEmbedded();

// Input refs:

  const passwordInputRef = useRef<HTMLInputElement>();
  const repeatPasswordInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;

  const isViewLoading = areButtonsDisabled;

  // Passwords match:

  const [{
    password,
    passwordsMatch,
  }, setPasswordsState] = useState({
    password: "",
    passwordsMatch: false,
  });

  const handlePasswordChange = useThrottledCallback(() => {
    const password = passwordInputRef.current.value;
    const repeatPassword = repeatPasswordInputRef.current.value;

    setPasswordsState({
      password,
      passwordsMatch: password === repeatPassword,
    });
  }, 250);

  const handleEmailSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const password = passwordInputRef.current.value || "";
    const repeatPassword = repeatPasswordInputRef.current.value || "";

    try {
      setIsAuthenticating(true);

      const supabase = await getSupabaseClient();

      if (!email || !password) {
        toast.error("Please enter an email and password");
        return;
      }

      if (password !== repeatPassword) {
        toast.error("Passwords do not match");
        return;
      }

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      navigate(EmbeddedPaths.AuthEmailVerify, {
        search: { email },
      });
    } catch (error) {
      toast.error("Error signing up");
    } finally {
      setIsAuthenticating(false);
    }
  }, [email]);

  useEffect(() => {
    if (!email) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No email search param. The router should have taken care of this.")
      } else {
        navigate(EmbeddedPaths.Auth)
      }
    }
  }, [email]);

  return (
    <OnboardingCard
      headerText="Create your password"
      subtitle="Enter a password to secure your Wander account."
      onBackButtonClick={() => navigate(`/auth`)}
      isLoading={ isViewLoading }
      onSubmit={ handleEmailSignup }>

      <PasswordInput
        name="password"
        placeholder="Enter your password"
        inputRef={passwordInputRef}
        disabled={areButtonsDisabled}
        onChange={ handlePasswordChange } />

      <PasswordInput
        name="repeatPassword"
        placeholder="Enter your password"
        inputRef={repeatPasswordInputRef}
        disabled={areButtonsDisabled}
        onChange={ handlePasswordChange } />

      <PasswordMatch matches={passwordsMatch} />

      <PasswordStrength password={password} />

      <Button type="submit" isFullWidth isDisabled={areButtonsDisabled}>
        Sign up
      </Button>
    </OnboardingCard>
  );
}
