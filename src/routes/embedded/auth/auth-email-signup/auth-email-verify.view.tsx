import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Box, Card, Text, WanderFooter, Button } from "~components/embed";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AuthEmailVerifyEmbeddedView() {
  const { navigate } = useLocation();
  const { authEmail } = useEmbedded();
  const [isResending, setIsResending] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    let timer: number | undefined;

    if (cooldownTime > 0) {
      timer = window.setInterval(() => {
        setCooldownTime((prevTime) => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return newTime;
        });
      }, 1000);
    } else {
      setCanResend(true);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  const handleResendEmail = useCallback(async () => {
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
      setCanResend(false);
      setCooldownTime(60);
    } catch (error) {
      toast.error("Error sending verification email");
    } finally {
      setIsResending(false);
    }
  }, [authEmail, canResend]);

  return (
    <Card
      headerText="Verify your email"
      footerElement={<WanderFooter />}
      hasBackButton={false}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(EmbeddedPaths.Auth)}
      size="auto"
      isLoading={ isResending }>
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
        </Flex>
      </Box>
    </Card>
  );
}
