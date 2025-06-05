import { toast } from "react-toastify";
import { Text, Button } from "~components/embed";
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  const { authenticate } = useEmbedded();
  const { email } = useSearchParams<{ email: string }>();
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));
  const [isComplete, setIsComplete] = useState(false);

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

  const getCode = () => {
    return inputRefs.current.map((input) => input.value.trim()).join("");
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!email || isVerifying) return;

    const otpCode = getCode();

    if (otpCode.length !== OTP_LENGTH) {
      if (e) toast.error(`Please enter all ${OTP_LENGTH} digits of the verification code`);
      return;
    }

    setIsComplete(true);
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
      console.error(error);
      toast.error("Invalid verification code");
    }

    // We leave isVerifying = true intentionally as the user will simply be redirected after verifying the account.
  };

  const focusInput = useCallback((inputOrIndex: HTMLInputElement | number) => {
    const input =
      typeof inputOrIndex === "number"
        ? inputRefs.current[Math.min(Math.max(inputOrIndex, 0), OTP_LENGTH - 1)]
        : inputOrIndex;

    if (!input) return;

    input.focus();

    requestAnimationFrame(() => {
      input.select();
    });
  }, []);

  const handleInputOrPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();

      const inputs = inputRefs.current;
      const rawValue =
        "clipboardData" in e ? e.clipboardData.getData("text/plain").trim() : e.currentTarget.value.trim();
      const sanitizedValue = rawValue.replace(/[^0-9]/g, "");
      const currentIndex = parseInt(e.currentTarget.name.replace("otp-input-", "")) || 0;

      if (!inputs) return;

      let nextEmptyIndex = currentIndex;

      if (sanitizedValue.length === OTP_LENGTH) {
        // Fill in digits starting from the start:
        for (let i = 0; i < OTP_LENGTH; ++i) {
          inputs[i].value = sanitizedValue[i];
        }
        nextEmptyIndex = OTP_LENGTH - 1;
      } else if (sanitizedValue) {
        // Fill in digits starting from the current position:
        for (let i = currentIndex; i < OTP_LENGTH; ++i) {
          const inputValue = sanitizedValue[i - currentIndex];

          if (inputValue) {
            inputs[i].value = inputValue;
            nextEmptyIndex = i + 1;
          }
        }
      } else {
        e.currentTarget.value = "";
      }

      // Focus next empty input or last one:
      focusInput(Math.min(nextEmptyIndex, OTP_LENGTH - 1));

      handleVerifyCode();
    },
    [focusInput, handleVerifyCode],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const currentIndex = parseInt(e.currentTarget.name.replace("otp-input-", "")) || 0;

      switch (e.key) {
        case "Backspace":
        case "Delete":
          if (e.currentTarget.value) {
            e.currentTarget.value = "";
          } else {
            focusInput(currentIndex - 1);
          }
          break;
        case "ArrowUp":
          focusInput(0);
          break;
        case "ArrowLeft":
          focusInput(currentIndex - 1);
          break;
        case "ArrowRight":
          focusInput(currentIndex + 1);
          break;
        case "ArrowDown":
          focusInput(OTP_LENGTH - 1);
          break;
      }
    },
    [focusInput],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLInputElement>) => {
      focusInput(e.currentTarget);
    },
    [focusInput],
  );

  const handleResendEmail = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const inputs = inputRefs.current;

      if (!email || !canResend || !inputs) return;

      for (let i = 0; i < OTP_LENGTH; ++i) {
        inputs[i].value = "";
      }

      try {
        setIsComplete(false);
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
      hasBackButton={false}
      isLoading={isResending}
      onSubmit={handleVerifyCode}>
      <Text variant={"bodySm"} alignment={"center"} style={{ color: "var(--text-color-secondary, #666666)" }}>
        Enter the 6-digit verification code from that email to complete signup. If you don't see the email, please check
        your spam folder.
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
              onInput={handleInputOrPaste}
              onPaste={handleInputOrPaste}
              onKeyDown={handleKeyDown}
              onMouseDown={handleMouseDown}
              autoFocus={index === 0}
            />
          ))}
        </Flex>
        <Button
          type="submit"
          variant="primary"
          isFullWidth
          isLoading={isVerifying}
          isDisabled={isVerifying || !isComplete}>
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
