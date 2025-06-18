import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import PasswordMatch from "~components/welcome/PasswordMatch";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { useThrottledCallback } from "@swyg/corre";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { PersistentStorage } from "~utils/storage";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { StorageKeys } from "~utils/storage/storage.constants";

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

  const [{ password, passwordsMatch }, setPasswordsState] = useState({
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

  const handleEmailSignUp = useCallback(
    async (e: React.FormEvent) => {
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
          toast.error(getFriendlyAuthErrorMessage(error, error.message || "Error signing up"));
          return;
        }

        await PersistentStorage.setItem(StorageKeys.CONNECT.AUTH.LAST_EMAIL_VERIFICATION, Date.now());

        navigate(EmbeddedPaths.AuthEmailVerify, {
          search: { email },
        });
      } catch (error) {
        toast.error(getFriendlyAuthErrorMessage(error, "Error signing up"));
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
      headerText="Create your password"
      subtitle="Enter a password to secure your Wander account."
      onBackButtonClick={() => navigate(`/auth`)}
      isLoading={isViewLoading}
      onSubmit={handleEmailSignUp}>
      <PasswordInput
        name="password"
        placeholder="Enter your password"
        inputRef={passwordInputRef}
        disabled={areButtonsDisabled}
        onChange={handlePasswordChange}
        autoFocus
      />

      <PasswordInput
        name="repeatPassword"
        placeholder="Confirm your password"
        inputRef={repeatPasswordInputRef}
        disabled={areButtonsDisabled}
        onChange={handlePasswordChange}
      />

      <PasswordMatch matches={passwordsMatch} />

      <PasswordStrength password={password} />

      <Button type="submit" isFullWidth isDisabled={areButtonsDisabled}>
        Sign up
      </Button>
    </OnboardingCard>
  );
}
