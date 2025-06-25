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
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { hasCooldownPassed } from "~utils/react/useCooldownCallback";
import { OPT_COOLDOWN_DURATION_SEC } from "~components/embed/ui/atoms/code-input/CodeInput";

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

      const shouldCallSignInWithOtp = await hasCooldownPassed({
        key: StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL,
        cooldownDuration: OPT_COOLDOWN_DURATION_SEC,
      });

      if (shouldCallSignInWithOtp) {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: false,
          },
        });

        if (error && error.code !== "over_email_send_rate_limit") {
          toast.error(getFriendlyAuthErrorMessage(error, "Error trying to recover account"));
          return;
        }

        if (!error) {
          await PersistentStorage.setItem(StorageKeys.CONNECT.AUTH.LAST_OTP_EMAIL, Date.now());
        }
      }

      navigate(EmbeddedPaths.AuthRecoverAccountOtp, {
        search: { email },
      });

      // Note we don't need to check if the email is verified or not. Once the user signs in using the OTP code, their
      // email is verified if it wasn't already and the router redirects them to the right page (add wallet, backup reminder...).
    } catch (error) {
      toast.error(getFriendlyAuthErrorMessage(error, "Error trying to recover account"));
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
