import { useEmbedded } from "~utils/_embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Text, Button } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient, signOut } from "~utils/_embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import PasswordStrength from "~components/welcome/PasswordStrength";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { useThrottledCallback } from "@swyg/corre";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { getFriendlyAuthErrorMessage, MIN_SUPABASE_PASSWORD_LENGTH } from "~utils/authentication/authentication.utils";
import { StorageKeys } from "~utils/storage/storage.constants";
import browser from "~iframe/browser";
import { CodeInput, type CodeInputHandle } from "~components/embed/ui/atoms/code-input/CodeInput";
import { useCooldownCallback } from "~utils/react/useCooldownCallback";
import { Flex } from "~components/common/Flex";
import { sleep } from "~utils/promises/sleep";
import { clearOtpAvailable, OTP_COOLDOWN_DURATION_SEC, OTP_LENGTH, setOtpAvailable } from "~utils/otp/otp.utils";
import type { SupabaseUserMetadata } from "embed-api";

export function AccountChangePasswordEmbeddedView() {
  const { navigate } = useLocation();
  const { authStatus, user, requestPasswordChange, setRequestPasswordChange } = useEmbedded();
  const { email, user_metadata } = user;

  // Input refs:

  const passwordInputRef = useRef<HTMLInputElement>();
  const repeatPasswordInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isResending, setIsResending] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isUpdatingPassword;
  const areButtonsDisabled = isViewLoading || isResending;

  // Code input:

  const codeInputRef = useRef<CodeInputHandle>();
  const [isComplete, setIsComplete] = useState(false);

  const handleCodeChange = useCallback((_, isComplete: boolean) => {
    setIsComplete(isComplete);
  }, []);

  // Code retrieval:

  const { fn: resendEmail, cooldownSeconds } = useCooldownCallback(
    async (showConfirmationToast: boolean) => {
      if (codeInputRef.current) codeInputRef.current.clear();

      try {
        setIsResending(true);
        const supabase = await getSupabaseClient();

        const { error } = await supabase.auth.reauthenticate();

        if (error) {
          toast.error(getFriendlyAuthErrorMessage(error, error.message));
          return;
        }

        setOtpAvailable();

        if (showConfirmationToast) toast.success("Password confirmation email resent successfully");
      } catch (error) {
        toast.error(getFriendlyAuthErrorMessage(error, "Error sending password confirmation email"));
      } finally {
        setIsResending(false);
      }
    },
    {
      key: StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL,
      cooldownDuration: OTP_COOLDOWN_DURATION_SEC,
    },
  );

  // Passwords match:

  const [confirmedPassword, setConfirmedPassword] = useState("");

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

  // Password change:

  const handleUpdatePassword = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (isUpdatingPassword) return;

      const passwordInput = passwordInputRef.current;
      const repeatPasswordInput = repeatPasswordInputRef.current;
      const otpCodeInput = codeInputRef.current;

      let password = "";
      let nonce: string | undefined;

      if (passwordInput && repeatPasswordInput) {
        password = passwordInputRef.current.value || "";
        const repeatPassword = repeatPasswordInputRef.current.value || "";

        if (password !== repeatPassword) {
          toast.error(browser.i18n.getMessage("passwords_not_match"));
          return;
        }

        if (password.length < MIN_SUPABASE_PASSWORD_LENGTH) {
          toast.error(`Password must be at least ${MIN_SUPABASE_PASSWORD_LENGTH} characters`);
          return;
        }
      } else if (otpCodeInput) {
        const otpCode = codeInputRef.current.getCode();

        if (otpCode.length !== OTP_LENGTH) {
          toast.error(`Please enter all ${OTP_LENGTH} digits of the verification code`);
          return;
        }

        password = confirmedPassword;
        nonce = otpCode;
      } else {
        return;
      }

      setIsUpdatingPassword(true);

      try {
        const supabase = await getSupabaseClient();

        // If the current session was created less than 24 hours ago, `updateUser()` will update the password when called
        // without a `nonce`. If it's been more than 24 hours, it will throw an error, as it requires a `nonce`. In that
        // case, we call `resendEmail()` and show the `CodeInput`. Once users enter the code, this function is called
        // again, but now it will include `nonce`.
        // See https://supabase.com/docs/reference/javascript/auth-reauthentication.

        const { error } = await supabase.auth.updateUser({
          password,
          nonce,
          data: user_metadata.hasPassword
            ? undefined
            : ({
                ...user_metadata,
                hasPassword: true,
              } satisfies SupabaseUserMetadata),
        });

        if (otpCodeInput) clearOtpAvailable();

        if (error) {
          const { message } = error;

          if (message === "Password update requires reauthentication") {
            resendEmail(false);
            setConfirmedPassword(password);
          } else if (message === "Nonce has expired or is invalid") {
            codeInputRef.current?.clear();
            toast.error("Invalid or expired code");
          } else {
            // In this case, the error is most likely related to the password itself (e.g. password is the same as before, password is too short, etc.), so we
            // just show the `PasswordInput` again:

            toast.error(getFriendlyAuthErrorMessage(error, message || "Error updating password"));
            setConfirmedPassword("");
          }

          return;
        }

        toast.success("Password updated successfully");

        setRequestPasswordChange(false);

        await sleep(100);

        navigate(EmbeddedPaths.WalletHomeEmbeddedView);
      } catch (error) {
        toast.error(getFriendlyAuthErrorMessage(error, "Error updating password"));
      } finally {
        setIsUpdatingPassword(false);
      }
    },
    [isUpdatingPassword, confirmedPassword, user_metadata, setRequestPasswordChange],
  );

  // Routing:

  useEffect(() => {
    if (!email) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No email search param. The router should have taken care of this.");
      } else {
        navigate(EmbeddedPaths.Auth);
      }
    }
  }, [email]);

  return confirmedPassword ? (
    <OnboardingCard
      headerText="Confirm your password"
      subtitle={`We've sent an email to ${email}`}
      onBackButtonClick={() =>
        requestPasswordChange ? signOut(false) : navigate(EmbeddedPaths.WalletHomeEmbeddedView)
      }
      isLoading={isViewLoading}
      onSubmit={handleUpdatePassword}>
      <Text variant={"bodySm"} alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
        Enter the 6-digit verification code from that email to change your password. If you don't see the email, please
        check your spam folder.
      </Text>

      <Flex direction="column" gap={12} width="100%">
        <Text alignment="center" variant={"bodySm"} style={{ color: "var(--text-color-secondary, #666666)" }}>
          Verification Code
        </Text>

        <CodeInput
          name="otp-input"
          inputRef={codeInputRef}
          disabled={areButtonsDisabled}
          onChange={handleCodeChange}
          autoFocus
        />
      </Flex>

      <Button
        type="submit"
        variant="primary"
        isFullWidth
        isLoading={isResending}
        isDisabled={areButtonsDisabled || !isComplete}>
        {browser.i18n.getMessage(user_metadata.hasPassword ? "change_password" : "set_password")}
      </Button>

      <Text variant="bodySm" alignment="center">
        Didn't receive the email?{" "}
        {cooldownSeconds === 0 ? (
          <Button variant="link" onClick={() => resendEmail(true)} isDisabled={areButtonsDisabled}>
            Send again
          </Button>
        ) : (
          <>Send again in {cooldownSeconds} seconds</>
        )}
      </Text>
    </OnboardingCard>
  ) : (
    <OnboardingCard
      headerText="Change your password"
      subtitle="Enter your new password."
      onBackButtonClick={() =>
        requestPasswordChange ? signOut(false) : navigate(EmbeddedPaths.WalletHomeEmbeddedView)
      }
      isLoading={areButtonsDisabled}
      onSubmit={handleUpdatePassword}>
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
        {browser.i18n.getMessage("continue")}
      </Button>
    </OnboardingCard>
  );
}
