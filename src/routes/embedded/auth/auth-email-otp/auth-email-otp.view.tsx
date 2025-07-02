import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button, Text } from "~components/embed";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { Flex } from "~components/common/Flex";
import { CodeInput, type CodeInputHandle } from "~components/embed/ui/atoms/code-input/CodeInput";
import { useCooldownCallback } from "~utils/react/useCooldownCallback";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { StorageKeys } from "~utils/storage/storage.constants";
import { PersistentStorage, useStorage } from "~utils/storage";
import type { PreferredEmailAuth } from "~utils/auth/auth.types";
import {
  checkNeedsNewOtp,
  clearOtpAvailable,
  OTP_COOLDOWN_DURATION_SEC,
  OTP_LENGTH,
  setOtpAvailable,
} from "~utils/otp/otp.utils";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";

export function AuthEmailOtpEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus, authenticate } = useEmbedded();

  const [_, setPreferredEmailAuth] = useStorage<PreferredEmailAuth | undefined>({
    key: StorageKeys.CONNECT.AUTH.PREFERRED_EMAIL_AUTH,
    instance: PersistentStorage,
  });

  // Loading state:

  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isVerifying;
  const areButtonsDisabled = isViewLoading || isResending;

  // Code input:

  const codeInputRef = useRef<CodeInputHandle>();
  const [isComplete, setIsComplete] = useState(false);

  const handleCodeChange = useCallback((_, isComplete: boolean) => {
    setIsComplete(isComplete);
  }, []);

  // Code retrieval:

  const { fn: signInWithOtp, cooldownSeconds } = useCooldownCallback(
    async (showConfirmationToast: boolean) => {
      try {
        if (codeInputRef.current) codeInputRef.current.clear();

        setIsResending(true);

        const supabase = await getSupabaseClient();

        const { error } = await supabase.auth.signInWithOtp({ email });

        if (error) {
          toast.error(getFriendlyAuthErrorMessage(error, "Error sending email access code"));
          return;
        }

        setOtpAvailable();

        if (showConfirmationToast) toast.success("Email access code resent successfully");

        // Note we don't need to check if the email is verified or not. Once the user signs in using the OTP code, their
        // email is verified if it wasn't already and the router redirects them to the right page (add wallet, backup reminder...).
      } catch (error) {
        toast.error(getFriendlyAuthErrorMessage(error, "Error sending email access code"));
      } finally {
        setIsResending(false);
      }
    },
    {
      key: StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL,
      cooldownDuration: OTP_COOLDOWN_DURATION_SEC,
    },
  );

  useAsyncEffect(async () => {
    try {
      if (await checkNeedsNewOtp()) signInWithOtp(false);
    } catch {
      // In case `LAST_OTP_EMAIL` is already be set in `localStorage` and the required time hasn't passed yet (so this call will throw an error).
    }
  }, [signInWithOtp]);

  // Handlers:

  const handleVerifyOtp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || isVerifying) return;

      const otpCode = codeInputRef.current.getCode();

      if (otpCode.length !== OTP_LENGTH) {
        toast.error(`Please enter all ${OTP_LENGTH} digits of the access code`);
        return;
      }

      setIsVerifying(true);

      try {
        await authenticate({
          method: "verifyOtp",
          email,
          token: otpCode,
        });

        setPreferredEmailAuth("otp");
      } catch (error) {
        setIsVerifying(false);
        toast.error(getFriendlyAuthErrorMessage(error, "Invalid or expired code"));
      } finally {
        clearOtpAvailable();
      }

      // We leave isVerifying = true intentionally as the user will simply be redirected after verifying the account.
    },
    [email, isVerifying, authenticate],
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
      headerText="Sign In"
      subtitle={`We've sent an email to ${email}`}
      onBackButtonClick={() => navigate(EmbeddedPaths.Auth)}
      isLoading={isViewLoading}
      onSubmit={handleVerifyOtp}>
      <Text variant={"bodySm"} alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
        Enter the 6-digit access code from that email to sign in to your account. If you don't see the email, please
        check your spam folder.
      </Text>

      <Flex direction="column" gap={12} width="100%">
        <Text alignment="center" variant={"bodySm"} style={{ color: "var(--text-color-secondary, #666666)" }}>
          Access Code
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
        Sign In
      </Button>

      <Text variant="bodySm" alignment="center">
        Didn't receive the email?{" "}
        {cooldownSeconds === 0 ? (
          <Button variant="link" onClick={() => signInWithOtp(true)} isDisabled={areButtonsDisabled}>
            Send again
          </Button>
        ) : (
          <>Send again in {cooldownSeconds} seconds</>
        )}
      </Text>

      <Text variant="bodySm" alignment="center">
        <Button variant="link" isDisabled={areButtonsDisabled} href={EmbeddedPaths.AuthEmailSignInPassword}>
          Use password instead
        </Button>
      </Text>
    </OnboardingCard>
  );
}
