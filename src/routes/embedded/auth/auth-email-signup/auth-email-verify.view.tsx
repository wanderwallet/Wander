import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Box, Card, Text, WanderFooter, Button } from "~components/embed";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseAuthFromUrl, getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PersistentStorage, useStorage } from "~utils/storage";

const COOLDOWN_DURATION = 60; // seconds

export function AuthEmailVerifyEmbeddedView() {
  const { navigate } = useLocation();
  const { authEmail, authPassword, setAuthPassword } = useEmbedded();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);

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
      setShowContinueButton(true);
      return;
    }

    setCooldownTime(initialCooldown);
    setCanResend(false);

    const timer = window.setInterval(() => {
      setCooldownTime((prevTime) => {
        if (prevTime <= 1) {
          setShowContinueButton(true);
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verifyEmailResentTimestamp]);

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

  const handleContinue = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        setIsLoading(true);
        const isSuccess = await getSupabaseAuthFromUrl(window.location.origin, "EMAIL_N_PASSWORD");
        if (!isSuccess && authEmail && authPassword) {
          const supabase = await getSupabaseClient();
          const { error } = await supabase.auth.signInWithPassword({
            email: authEmail,
            password: authPassword,
          });

          if (error) {
            toast.error(error.message);
          } else {
            setAuthPassword(null);
          }
        }
      } catch (error) {
        console.error("Error continuing to wallet creation:", error);
      } finally {
        setTimeout(() => setIsLoading(false), 2000);
      }
    },
    [navigate, authEmail, authPassword],
  );

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
            Click on the link in that email to complete your sign up. If you do not see it, you may need to check your
            spam folder.
          </Text>
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
          {showContinueButton && (
            <Flex direction="column" gap={4} width="100%">
              <Text variant={"bodyXs"} alignment={"center"}>
                Email verified but still not redirected to wallet creation?
              </Text>
              <Button variant="link" isFullWidth isLoading={isLoading} onClick={handleContinue}>
                Click here to continue
              </Button>
            </Flex>
          )}
        </Flex>
      </Box>
    </Card>
  );
}
