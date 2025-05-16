import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Box, Card, Text, WanderFooter, Button } from "~components/embed";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PersistentStorage, useStorage } from "~utils/storage";

const COOLDOWN_DURATION = 60; // seconds
const OTP_LENGTH = 6;

export function AuthEmailVerifyEmbeddedView() {
  const { navigate } = useLocation();
  const { authEmail, authStatus } = useEmbedded();
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
      if (isOtpComplete(digits) && authEmail) {
        setTimeout(() => {
          const otpCode = digits.join("");
          handleVerifyCode(otpCode);
        }, 300);
      }
    },
    [authEmail],
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
    if (!authEmail) return;

    setIsVerifying(true);
    try {
      const supabase = await getSupabaseClient();

      const { error } = await supabase.auth.verifyOtp({
        email: authEmail,
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
    if (!authEmail) return;

    const otpCode = otpDigits.join("");
    if (otpCode.length !== OTP_LENGTH) {
      toast.error(`Please enter all ${OTP_LENGTH} digits of the verification code`);
      return;
    }

    handleVerifyCode(otpCode);
  }, [authEmail, otpDigits]);

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

      if (!authEmail || !canResend) return;

      try {
        setIsResending(true);
        const supabase = await getSupabaseClient();

        const { error } = await supabase.auth.resend({
          type: "signup",
          email: authEmail,
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
    [authEmail, canResend, setVerifyEmailResentTimestamp],
  );

  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

  return (
    <Card
      headerText="Verify your email"
      footerElement={<WanderFooter />}
      hasBackButton={false}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(EmbeddedPaths.Auth)}
      size="auto">
      <Box style={{ gap: 32 }}>
        <Text style={{ color: "var(--text-color-primary, #121212)" }} variant={"bodyLg"} alignment={"center"}>
          We've sent an email to {authEmail}
        </Text>
        <Flex direction="column" gap={24} width="100%">
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
                  id={`otp-input-${index}`}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={otpDigits[index] || ""}
                  onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={(e) => handlePaste(e, index)}
                  style={{
                    width: "40px",
                    height: "48px",
                    textAlign: "center",
                    fontSize: "18px",
                    border: "1px solid var(--border-color, #E0E0E0)",
                    borderRadius: "8px",
                    backgroundColor: "var(--background-color-input, #FFFFFF)",
                    color: "var(--text-color-primary, #121212)",
                    outline: "none",
                  }}
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

          <Flex direction="column" gap={4} width="100%">
            <Text variant={"bodyXs"} alignment={"center"} style={{ color: "var(--text-color-tertiary, #838383)" }}>
              Didn't receive the message?
            </Text>
            {canResend ? (
              <Button variant="link" isFullWidth onClick={handleResendEmail} isLoading={isResending}>
                Send again
              </Button>
            ) : (
              <Text variant={"bodyXs"} alignment={"center"}>
                Send again in {cooldownTime} seconds
              </Text>
            )}
          </Flex>
        </Flex>
      </Box>
    </Card>
  );
}
