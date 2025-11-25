import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button, Column, Text } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { isInsideIframe } from "~utils/embedded/iframe.utils";

const insideIframe = isInsideIframe();

export function AuthEmailOtpEmbeddedView() {
  const { navigate, location } = useLocation();
  const { email, isAlreadyRegistered: isAlreadyRegisteredParam } = useSearchParams<{
    email: string;
    isAlreadyRegistered: string;
  }>();
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

  const handleVerifyOtp = useCallback(async () => {
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

      // This is done to clear the search params (email and isAlreadyRegistered):
      navigate(location, { search: { email } });

      setPreferredEmailAuth("otp");
    } catch (error) {
      setIsVerifying(false);
      toast.error(getFriendlyAuthErrorMessage(error, "Invalid or expired code"));
    } finally {
      clearOtpAvailable();
    }

    // We leave isVerifying = true intentionally as the user will simply be redirected after verifying the account.
  }, [email, isVerifying, authenticate]);

  const handleCodeChange = useCallback(
    (_, isComplete: boolean) => {
      if (isComplete) {
        handleVerifyOtp();
      }
    },
    [handleVerifyOtp],
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
      headerText={`Enter the code sent to ${email}`}
      onBackButtonClick={() => navigate(EmbeddedPaths.Auth)}
      isLoading={isViewLoading}
      onSubmit={handleVerifyOtp}>
      <Column>
        <Text alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
          This code will expire after 1 hour.
        </Text>
        <Text>
          <Button
            variant="link"
            onClick={() => signInWithOtp(true)}
            isDisabled={areButtonsDisabled || cooldownSeconds > 0}>
            Send again
          </Button>
          {cooldownSeconds > 0 && ` in ${cooldownSeconds} seconds`}
        </Text>
      </Column>

      <Flex direction="column" gap={8} style={{ marginTop: 20 }} width="100%">
        <Text
          alignment={insideIframe ? "left" : "center"}
          variant={"bodySm"}
          style={{ color: "var(--text-color-secondary, #666666)" }}>
          Secure code
        </Text>

        <CodeInput
          name="otp-input"
          inputRef={codeInputRef}
          disabled={areButtonsDisabled}
          onChange={handleCodeChange}
          autoFocus
        />
      </Flex>

      {isAlreadyRegisteredParam === "0" ? null : (
        <Text variant="bodySm" alignment="center" style={{ marginTop: 20 }}>
          Prefer signing in with password?{" "}
          <Button variant="link" isDisabled={areButtonsDisabled} href={EmbeddedPaths.AuthEmailSignInPassword}>
            Use password
          </Button>
        </Text>
      )}
    </OnboardingCard>
  );
}
