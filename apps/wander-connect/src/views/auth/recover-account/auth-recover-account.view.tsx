import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Button, Divider, InputButton, KeyIcon, OnboardingCard, RecoverHeaderIcon, SeedIcon, TextInput } from "@wanderapp/ui";
import { isValidEmail, useLocation, useSearchParams } from "@wanderapp/core";
import { QrCode02 } from "@untitled-ui/icons-react";
import { getFriendlyAuthErrorMessage } from "../../../domains/authentication/authentication.utils";
import { EmbeddedPaths } from "../../../router/dashboard/iframe.routes";
import { useEmbedded } from "../../../utils/embedded.hooks";
import { getSupabaseClient } from "../../../utils/embedded.utils";

export function AuthRecoverAccountEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus } = useEmbedded();

  // Input refs:

  const emailInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const isViewLoading = authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading";
  const areButtonsDisabled = isViewLoading || isCheckingEmail;

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

      const { data, error } = await supabase.rpc("user_exists_by_email", {
        p_email: email,
      });

      const isAlreadyRegistered =
        !!data || error?.message === "An account with this email already exists, but it is not using a password.";

      if (error && error.message !== "An account with this email already exists, but it is not using a password.") {
        toast.error(getFriendlyAuthErrorMessage(error, error.message || "Error checking email"));
        return;
      }

      if (!isAlreadyRegistered) {
        toast.error(`No account found for ${email}`);
        return;
      }

      navigate(EmbeddedPaths.AuthRecoverAccountOtp, {
        search: { email },
      });
    } catch (error) {
      toast.error(getFriendlyAuthErrorMessage(error, "Error checking email"));
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  const emailInputButton = <InputButton type="submit" label="Next" loading={isCheckingEmail} />;

  return (
    <OnboardingCard
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle="Select a method for recovering your account."
      onBackButtonClick={() => navigate(`/auth`)}
      isLoading={isViewLoading}
      onSubmit={handleCheckEmail}>
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
