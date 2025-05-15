import { toast } from "react-toastify";
import { Button, Text } from "~components/embed";
import { useCallback, useEffect, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AuthEmailVerifyEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
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
      setCanResend(false);
      setCooldownTime(60);
    } catch (error) {
      toast.error("Error sending verification email");
    } finally {
      setIsResending(false);
    }
  }, [email, canResend]);

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
        Click on the link in that email to complete your sign up. If you do not see it, you may need to check your
        spam folder.
      </Text>

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
