import { toast } from "react-toastify";
import { Text, Button } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PersistentStorage, useStorage } from "~utils/storage";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { Flex } from "~components/common/Flex";

import styles from "./auth-email-verify.module.scss";

const COOLDOWN_DURATION = 60; // seconds
const OTP_LENGTH = 6;

export function AuthEmailVerifyEmbeddedView() {
  const { navigate } = useLocation();
  const { authStatus } = useEmbedded();
  const { email } = useSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const authStatusRef = useRef(authStatus);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));

  const [verifyEmailResentTimestamp, setVerifyEmailResentTimestamp] = useStorage<number>(
    { key: "sb-verify-email-resent-timestamp", instance: PersistentStorage },
    (v) => (v === undefined ? Date.now() : v),
  );

  useEffect(() => {
    if (!verifyEmailResentTimestamp) return;

    const now = Date.now();
    const elapsedTime = Math.floor((now - verifyEmailResentTimestamp) / 1000);
    const initialCooldown = Math.max(0, COOLDOWN_DURATION - elapsedTime);

    if (initialCooldown === 0) {
      setCanResend(true);
      setCooldownTime(0);
      return;
    }

    setCooldownTime(initialCooldown);
    setCanResend(false);

    const timer = window.setInterval(() => {
      setCooldownTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verifyEmailResentTimestamp]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < OTP_LENGTH && inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  }, []);

  const isOtpComplete = useCallback((digits: string[]) => {
    return digits.join("").length === OTP_LENGTH;
  }, []);

  const autoSubmitIfComplete = useCallback(
    (digits: string[]) => {
      if (isOtpComplete(digits) && email) {
        setTimeout(() => {
          const otpCode = digits.join("");
          handleVerifyCode(otpCode);
        }, 300);
      }
    },
    [email],
  );

  const handleOtpDigitChange = useCallback(
    (index: number, value: string) => {
      const sanitizedValue = value.replace(/[^0-9]/g, "");
      const newDigits = [...otpDigits];

      if (sanitizedValue.length > 0) {
        // Fill in digits starting from current position
        for (let i = 0; i < sanitizedValue.length && index + i < OTP_LENGTH; i++) {
          newDigits[index + i] = sanitizedValue[i];
        }

        // Focus next input if available
        const nextIndex = Math.min(index + sanitizedValue.length, OTP_LENGTH - 1);
        if (index + sanitizedValue.length < OTP_LENGTH) {
          focusInput(nextIndex);
        }
      } else {
        // Handle backspace/delete
        newDigits[index] = "";
      }

      setOtpDigits(newDigits);
      autoSubmitIfComplete(newDigits);
    },
    [otpDigits, focusInput, autoSubmitIfComplete],
  );

  const handleVerifyCode = async (otpCode: string) => {
    if (!email) return;

    setIsVerifying(true);
    try {
      const supabase = await getSupabaseClient();

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: "email",
      });

      if (error) {
        toast.error(error.message || "Invalid verification code");
        return;
      }

      toast.success("Email verified successfully");
      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (authStatusRef.current === "noWallets") {
            resolve(null);
            clearInterval(interval);
          }
        }, 100);
      });
      navigate(EmbeddedPaths.WalletHomeEmbeddedView);
    } catch (error) {
      toast.error("Error verifying email");
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyOtp = useCallback(() => {
    if (!email) return;

    const otpCode = otpDigits.join("");
    if (otpCode.length !== OTP_LENGTH) {
      toast.error(`Please enter all ${OTP_LENGTH} digits of the verification code`);
      return;
    }

    handleVerifyCode(otpCode);
  }, [email, otpDigits]);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData("text/plain").trim();
      const sanitizedValue = pastedData.replace(/[^0-9]/g, "");

      if (sanitizedValue) {
        const newDigits = [...otpDigits];

        // Fill in digits starting from current position
        for (let i = 0; i < sanitizedValue.length && index + i < OTP_LENGTH; i++) {
          newDigits[index + i] = sanitizedValue[i];
        }

        // Find next empty input or focus last input
        const nextEmptyIndex = newDigits.findIndex((digit, idx) => idx >= index && !digit);
        const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : OTP_LENGTH - 1;
        focusInput(focusIndex);

        setOtpDigits(newDigits);
        autoSubmitIfComplete(newDigits);
      }
    },
    [otpDigits, focusInput, autoSubmitIfComplete],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      switch (e.key) {
        case "Backspace":
          if (!otpDigits[index] && index > 0) {
            focusInput(index - 1);
          }
          break;
        case "ArrowLeft":
          if (index > 0) {
            focusInput(index - 1);
          }
          break;
        case "ArrowRight":
          if (index < OTP_LENGTH - 1) {
            focusInput(index + 1);
          }
          break;
      }
    },
    [otpDigits, focusInput],
  );

  const handleResendEmail = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (!email || !canResend) return;

      try {
        setIsResending(true);
        const supabase = await getSupabaseClient();

        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });

        if (error) {
          toast.error(error.message);
          return;
        }

        toast.success("Verification email resent successfully");
        setVerifyEmailResentTimestamp(Date.now());
        setCanResend(false);
        setCooldownTime(COOLDOWN_DURATION);
      } catch (error) {
        toast.error("Error sending verification email");
      } finally {
        setIsResending(false);
      }
    },
    [email, canResend, setVerifyEmailResentTimestamp],
  );

  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

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
      headerText="Verify your email"
      subtitle={ `We've sent an email to ${email}` }
      hasBackButton={false}
      isLoading={ isResending }>

      <Text variant={"bodySm"} alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
        Enter the 6-digit verification code from that email to complete signup. If you don't see the email, please
        check your spam folder.
      </Text>

      <Flex direction="column" gap={16} width="100%">
        <Text alignment="center" variant={"bodySm"} style={{ color: "var(--text-color-secondary, #666666)" }}>
          Verification Code
        </Text>
        <Flex direction="row" gap={8} width="100%" justify="center">
          {Array.from({ length: OTP_LENGTH }).map((_, index) => (
            <input
              key={index}
              type="text"
              className={styles["input"]}
              name={`otp-input-${index}`}
              ref={(el) => (inputRefs.current[index] = el)}
              maxLength={1}
              value={otpDigits[index] || ""}
              onChange={(e) => handleOtpDigitChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={(e) => handlePaste(e, index)}
              autoFocus={ index === 0 }
            />
          ))}
        </Flex>
        <Button
          variant="primary"
          isFullWidth
          onClick={verifyOtp}
          isLoading={isVerifying}
          isDisabled={isVerifying || !isOtpComplete(otpDigits)}>
          Verify Code
        </Button>
      </Flex>


      <Text variant={"bodyXs"} alignment={"center"} style={{ color: "var(--text-color-tertiary, #838383)" }}>
        Didn't receive the message?
      </Text>

      {canResend ? (
        <Button variant="link" isFullWidth onClick={handleResendEmail} isDisabled={isResending}>
          Send again
        </Button>
      ) : (
        <Text variant={"bodyXs"} alignment={"center"}>
          Send again in {cooldownTime} seconds
        </Text>
      )}
    </OnboardingCard>
  );
}
