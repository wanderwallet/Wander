import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Divider, KeyIcon, RecoverHeaderIcon, SeedIcon, TextInput } from "~components/embed/ui";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { QrCode02 } from "@untitled-ui/icons-react";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { isValidEmail } from "~utils/email";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { StorageKeys } from "~utils/storage/storage.constants";
import { PersistentStorage } from "~utils/storage";

export function AuthRecoverAccountEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus } = useEmbedded();

  // Input refs:

  const emailInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;
  const isViewLoading = areButtonsDisabled && !isAuthenticating;

  // Handlers:

  const signInWithOtp = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsAuthenticating(true);

      const supabase = await getSupabaseClient();

      const email = emailInputRef.current?.value || "";

      if (!email || !isValidEmail(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      // TODO: Check if LAST_OTP_SIGN_IN?

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

      await PersistentStorage.setItem(StorageKeys.CONNECT.AUTH.LAST_OTP_SIGN_IN, Date.now());

      navigate(EmbeddedPaths.AuthRecoverAccountOtp, {
        search: { email },
      });

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
      console.log("catch error", error);
      toast.error("Error checking email");
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const emailInputButton = <InputButton type="submit" label="Next" loading={isAuthenticating} />;

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle="Select a method for logging in on new devices and recovering your account."
      onBackButtonClick={() => navigate(`/auth`)}
      isLoading={isViewLoading}
      onSubmit={signInWithOtp}>
      <TextInput
        name="email"
        placeholder="Enter your email"
        defaultValue={email}
        inputRef={emailInputRef}
        disabled={areButtonsDisabled}
        endSlot={emailInputButton}
      />

      <Divider text={"OR"} />

      <Button href="/auth/recover-account/seedphrase" variant="outlined" isFullWidth icon={<SeedIcon fontSize={24} />}>
        Enter Seedphrase
      </Button>

      <Button href="/auth/recover-account/keyfile" variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />}>
        Import Keyfile
      </Button>

      <Button
        href="/auth/recover-account/qrcode"
        variant="outlined"
        isFullWidth
        icon={<QrCode02 fontSize={24} color="currentColor" />}>
        Scan QR Code
      </Button>
    </OnboardingCard>
  );
}
