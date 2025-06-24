import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Text, RecoverHeaderIcon } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { isValidEmail } from "~utils/email";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import {
  CodeInput,
  OPT_COOLDOWN_DURATION_SEC,
  OTP_LENGTH,
  type CodeInputHandle,
} from "~components/embed/ui/atoms/code-input/CodeInput";
import { useCooldownCallback } from "~utils/react/useCooldownCallback";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { StorageKeys } from "~utils/storage/storage.constants";

export function AuthRecoverAccountOtpEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus, authenticate } = useEmbedded();

  // Loading state:

  const [isReAuthenticating, setIsReAuthenticating] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    isReAuthenticating ||
    isVerifyingOtp;
  const isViewLoading = areButtonsDisabled;

  // Code input:

  const codeInputRef = useRef<CodeInputHandle>();
  const [isComplete, setIsComplete] = useState(false);

  const handleCodeChange = useCallback((_, isComplete: boolean) => {
    setIsComplete(isComplete);
  }, []);

  // Code retrieval:

  const { fn: signInWithOtp, cooldownSeconds } = useCooldownCallback(
    async () => {
      try {
        setIsReAuthenticating(true);

        const supabase = await getSupabaseClient();

        const { data, error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });

        console.log({ data, error });

        if (error) {
          console.log("signInWithOtp error", error);
          toast.error("Error checking email");
          return;
        }

        toast.error(getFriendlyAuthErrorMessage(error, "Error sending account recovery email"));

        // TODO: What if email is not confirmed yet?
      } catch (error) {
        console.log("catch error", error);
        toast.error("Error checking email");
        // toast.success("Password confirmation email resent successfully");
      } finally {
        setIsReAuthenticating(false);
      }
    },
    {
      key: StorageKeys.CONNECT.AUTH.LAST_OTP_SIGN_IN,
      cooldownDuration: OPT_COOLDOWN_DURATION_SEC,
    },
  );

  // Handlers:

  const handleVerifyOtp = useCallback(async () => {
    if (!email || isVerifyingOtp) return;

    const otpCode = codeInputRef.current.getCode();

    if (otpCode.length !== OTP_LENGTH) {
      toast.error(`Please enter all ${OTP_LENGTH} digits of the verification code`);
      return;
    }

    setIsVerifyingOtp(true);

    console.log("AUTHENTICATE WITH CODE =", otpCode);

    try {
      await authenticate({
        method: "verifyOtp",
        email,
        token: otpCode,
      });

      toast.success("Email verified successfully");
    } catch (error) {
      setIsVerifyingOtp(false);
      toast.error(getFriendlyAuthErrorMessage(error, "Invalid or expired code"));
    }

    // We leave isVerifying = true intentionally as the user will simply be redirected after verifying the account.
  }, [email, isVerifyingOtp, authenticate]);

  console.log("email =", email);

  /*
  useEffect(() => {
    if (!email) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No email search param. The router should have taken care of this.");
      } else {
        navigate(EmbeddedPaths.Auth);
      }
    }
  }, [email]);
  */

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle={`We've sent an email to ${email}`}
      onBackButtonClick={() => navigate(EmbeddedPaths.AuthRecoverAccount)}
      isLoading={isViewLoading}
      onSubmit={handleVerifyOtp}>
      <Text variant={"bodySm"} alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
        Enter the 6-digit verification code from that email to recover your account. If you don't see the email, please
        check your spam folder.
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
        Recover account
      </Button>

      <Text variant="bodySm" alignment="center">
        Didn't receive the email?{" "}
        {cooldownSeconds === 0 ? (
          <Button variant="link" onClick={signInWithOtp} isDisabled={isViewLoading}>
            Send again
          </Button>
        ) : (
          <>Send again in {cooldownSeconds} seconds</>
        )}
      </Text>
    </OnboardingCard>
  );
}
