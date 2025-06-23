import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button } from "~components/embed";
import { useCallback, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import PasswordMatch from "~components/welcome/PasswordMatch";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { useThrottledCallback } from "@swyg/corre";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { PersistentStorage } from "~utils/storage";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { StorageKeys } from "~utils/storage/storage.constants";
import browser from "~iframe/browser";

export function AccountChangePasswordEmbeddedView() {
  const { navigate } = useLocation();
  const { authStatus } = useEmbedded();

  // Input refs:

  const passwordInputRef = useRef<HTMLInputElement>();
  const repeatPasswordInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isUpdatingPassword;

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

  const handleConfirmPassword = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const password = passwordInputRef.current.value || "";
    const repeatPassword = repeatPasswordInputRef.current.value || "";

    try {
      setIsUpdatingPassword(true);

      const supabase = await getSupabaseClient();

      if (password !== repeatPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // const { error } = await supabase.auth.reauthenticate()

      const { error, data } = await supabase.auth.updateUser({
        password,
        nonce,
        data: {
          hasPassword: true,
        },
      });

      if (error) {
        toast.error(getFriendlyAuthErrorMessage(error, error.message || "Error changing password"));
        return;
      }

      await PersistentStorage.setItem(StorageKeys.CONNECT.AUTH.LAST_EMAIL_VERIFICATION, Date.now());

      // TODO: Toast to confirm password change.

      navigate(EmbeddedPaths.WalletHomeEmbeddedView);
    } catch (error) {
      toast.error(getFriendlyAuthErrorMessage(error, "Error changing password"));
    } finally {
      setIsUpdatingPassword(false);
    }
  }, []);

  const handleChangePassword = useCallback(() => {}, []);

  return (
    <OnboardingCard
      headerText="Change your password"
      subtitle="Enter your new password."
      onBackButtonClick={() => navigate(`/`)}
      isLoading={isViewLoading}
      onSubmit={handleChangePassword}>
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
        {browser.i18n.getMessage("change_password")}
      </Button>
    </OnboardingCard>
  );
}
