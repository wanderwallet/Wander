import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Divider, KeyIcon, RecoverHeaderIcon, SeedIcon, TextInput } from "~components/embed/ui";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { isValidEmail } from "~utils/email";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";

export function AuthRecoverAccountEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus } = useEmbedded();

  // Input refs:

  const emailInputRef = useRef<HTMLInputElement>();
  const otpInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const areButtonsDisabled = isAuthenticating || isCheckingEmail;

  const isViewLoading = areButtonsDisabled && !isCheckingEmail;

  // Handlers:

  const handleCheckEmail = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsCheckingEmail(true);

      const supabase = await getSupabaseClient();

      const email = emailInputRef.current?.value || "";

      if (!email || !isValidEmail(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // shouldCreateUser: false,
        },
      });

      console.log({ data, error });

      // TODO: What if email is not confirmed yet?

      /*
      const { data: isAlreadyRegistered, error } = await supabase.rpc("user_exists_by_email", {
        p_email: email,
      });

      if (error) {
        toast.error(error.message || "Error checking email");
        return;
      }

      navigate(isAlreadyRegistered ? EmbeddedPaths.AuthEmailSignin : EmbeddedPaths.AuthEmailSignup, {
        search: { email },
      });
      */
    } catch (error) {
      console.log(error);
      toast.error("Error checking email");
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  const authStatusRef = useRef(authStatus);

  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

  const handleSignIn = useCallback(async () => {
    const otpCode = otpInputRef.current.value;

    if (!email || !otpCode) return;

    setIsAuthenticating(true);

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
      setIsAuthenticating(false);
    }
  }, []);

  const emailInputButton = (
    <InputButton
      type="submit"
      label="Next"
      loading={ isCheckingEmail } />
  );

  const otpInputButton = (
    <InputButton
      type="submit"
      label="Next"
      loading={ isCheckingEmail }
      onClick={ handleSignIn } />
  );

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle="Select a method for logging in on new devices and recovering your account."
      onBackButtonClick={() => navigate(`/auth`)}
      onSubmit={ handleCheckEmail }>

      <TextInput
        name="email"
        placeholder="Enter your email"
        defaultValue={ email }
        inputRef={emailInputRef}
        disabled={areButtonsDisabled}
        endSlot={emailInputButton}
      />

      <TextInput
        name="otp"
        placeholder="Email code"
        inputRef={otpInputRef}
        disabled={areButtonsDisabled}
        endSlot={otpInputButton}
      />

      <Divider text={"OR"} />

      <Button
        href="/auth/recover-account/seedphrase"
        variant="outlined"
        isFullWidth
        icon={<SeedIcon fontSize={24} />}>
        Enter Seedphrase
      </Button>

      <Button href="/auth/recover-account/keyfile" variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />}>
        Import Keyfile
      </Button>
    </OnboardingCard>
  );
}
