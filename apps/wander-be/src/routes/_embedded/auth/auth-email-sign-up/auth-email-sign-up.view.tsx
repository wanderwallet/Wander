import { useEmbedded } from "~utils/_embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button, TextInput } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/_embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { useThrottledCallback } from "@swyg/corre";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { PersistentStorage } from "~utils/storage";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { EditIcon } from "@iconicicons/react";
import { getFriendlyAuthErrorMessage, MIN_SUPABASE_PASSWORD_LENGTH } from "~utils/authentication/authentication.utils";
import { StorageKeys } from "~utils/storage/storage.constants";
import browser from "~iframe/browser";
import type { SupabaseUserMetadata } from "embed-api";

export function AuthEmailSignUpEmbeddedView() {
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

  const isPasswordValid = passwordsMatch && password.length >= MIN_SUPABASE_PASSWORD_LENGTH;

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
          toast.error(browser.i18n.getMessage("passwords_not_match"));
          return;
        }

        if (password.length < MIN_SUPABASE_PASSWORD_LENGTH) {
          toast.error(`Password must be at least ${MIN_SUPABASE_PASSWORD_LENGTH} characters`);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              hasPassword: true,
            } satisfies SupabaseUserMetadata,
          },
        });

        if (error) {
          toast.error(getFriendlyAuthErrorMessage(error, error.message || "Error signing up"));
          return;
        }

        await PersistentStorage.setItem(StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL, Date.now());

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

  const editIcon = (
    <EditIcon
      aria-label="Edit"
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}
    />
  );

  const emailInputButton = (
    <InputButton
      icon={editIcon}
      disabled={areButtonsDisabled}
      onClick={() => navigate("/auth", { search: { email } })}
    />
  );

  return (
    <OnboardingCard
      headerText="Create your password"
      subtitle="Enter a password to secure your Wander account."
      onBackButtonClick={() => navigate(EmbeddedPaths.Auth)}
      isLoading={isViewLoading}
      onSubmit={handleEmailSignUp}>
      <TextInput
        name="email"
        placeholder="Enter your email"
        value={email}
        disabled={areButtonsDisabled}
        readOnly
        endSlot={emailInputButton}
      />

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

      <PasswordStrength password={password} passwordsMatch={passwordsMatch} minLength={MIN_SUPABASE_PASSWORD_LENGTH} />

      <Button type="submit" isFullWidth isDisabled={areButtonsDisabled || !isPasswordValid}>
        Sign up
      </Button>
    </OnboardingCard>
  );
}
