import { toast } from "react-toastify";
import { Text, Button } from "~components/embed";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { Flex } from "~components/common/Flex";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { StorageKeys } from "~utils/storage/storage.constants";
import {
  CodeInput,
  OPT_COOLDOWN_DURATION_SEC,
  OTP_LENGTH,
  type CodeInputHandle,
} from "~components/embed/ui/atoms/code-input/CodeInput";
import { useCooldownCallback } from "~utils/react/useCooldownCallback";

export function AuthEmailVerifyEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate } = useEmbedded();
  const { email } = useSearchParams<{ email: string }>();

  // Loading state:

  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const isViewLoading = isResending || isVerifying;

  // Code input:

  const codeInputRef = useRef<CodeInputHandle>();
  const [isComplete, setIsComplete] = useState(false);

  const handleCodeChange = useCallback((_, isComplete: boolean) => {
    setIsComplete(isComplete);
  }, []);

  // Code retrieval:

  const { fn: resendEmail, cooldownSeconds } = useCooldownCallback(
    async (showConfirmationToast: boolean) => {
      if (!email) return;

      codeInputRef.current.clear();

      try {
        setIsResending(true);
        const supabase = await getSupabaseClient();

        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });

        if (error) {
          toast.error(getFriendlyAuthErrorMessage(error, error.message));
          return;
        }

        if (showConfirmationToast) toast.success("Verification email resent successfully");
      } catch (error) {
        toast.error(getFriendlyAuthErrorMessage(error, "Error sending verification email"));
      } finally {
        setIsResending(false);
      }
    },
    {
      key: StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL,
      cooldownDuration: OPT_COOLDOWN_DURATION_SEC,
    },
  );

  useEffect(() => {
    try {
      resendEmail(false);
    } catch (err) {
      // When coming from `AuthEmailSignUpEmbeddedView` for the first time, `LAST_OTP_EMAIL` would already be set
      // in `localStorage`, so this call will throw an error. If the user doesn't confirm the email now and comes back
      // later, then if the required time has passed, a new code will be requested automatically.
    }
  }, [resendEmail]);

  // Code verification:

  const handleVerifyCode = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!email || isVerifying) return;

      const otpCode = codeInputRef.current.getCode();

      if (otpCode.length !== OTP_LENGTH) {
        toast.error(`Please enter all ${OTP_LENGTH} digits of the verification code`);
        return;
      }

      setIsVerifying(true);

      try {
        await authenticate({
          method: "verifyOtp",
          email,
          token: otpCode,
        });

        toast.success("Email verified successfully");
      } catch (error) {
        setIsVerifying(false);
        toast.error(getFriendlyAuthErrorMessage(error, "Invalid or expired code"));
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
      headerText="Verify your email"
      subtitle={`We've sent an email to ${email}`}
      onBackButtonClick={() => navigate(EmbeddedPaths.Auth)}
      isLoading={isViewLoading}
      onSubmit={handleVerifyCode}>
      <Text variant={"bodySm"} alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
        Enter the 6-digit verification code from that email to complete signup. If you don't see the email, please check
        your spam folder.
      </Text>

      <Flex direction="column" gap={12} width="100%">
        <Text alignment="center" variant={"bodySm"} style={{ color: "var(--text-color-secondary, #666666)" }}>
          Verification Code
        </Text>

        <CodeInput
          name="otp-input"
          inputRef={codeInputRef}
          disabled={isViewLoading}
          onChange={handleCodeChange}
          autoFocus
        />
      </Flex>

      <Button type="submit" variant="primary" isFullWidth isDisabled={isViewLoading || !isComplete}>
        Verify Code
      </Button>

      <Text variant="bodySm" alignment="center">
        Didn't receive the email?{" "}
        {cooldownSeconds === 0 ? (
          <Button variant="link" onClick={() => resendEmail(true)} isDisabled={isViewLoading}>
            Send again
          </Button>
        ) : (
          <>Send again in {cooldownSeconds} seconds</>
        )}
      </Text>
    </OnboardingCard>
  );
}
