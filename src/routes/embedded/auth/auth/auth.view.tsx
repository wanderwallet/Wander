import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import {
  Button,
  Divider,
  GoogleIcon,
  TextInput,
  Row,
  SocialsIcon,
  Text,
  Wander2Icon,
} from "~components/embed";
import React, { useCallback, useRef, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation } from "~wallets/router/router.utils";
import { isValidEmail } from "~utils/email";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { sleep } from "~utils/promises/sleep";
import { EMBEDDED_HIDE_BE } from "~utils/embedded/iframe.utils";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

export function AuthEmbeddedView() {
  const { navigate } = useLocation();
  const { authenticate, authStatus, recoverableAccount } = useEmbedded();

  // Input refs:

  const emailInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating || isCheckingEmail;

  const isViewLoading = areButtonsDisabled && !isCheckingEmail;

  // Handlers:

  const handleAuthenticate = useCallback(async (authProviderType: AuthProviderType) => {
    try {
      setIsAuthenticating(true);
      await authenticate(authProviderType);
    } catch (error) {
      toast.error(`Error signing in with ${authProviderType}`);
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const handleNativeWallet = useCallback(async () => {
    setIsAuthenticating(true);

    try {
      postEmbeddedMessage({
        type: "embedded_auth",
        data: {
          authType: "NATIVE_WALLET",
          authStatus: null,
          userDetails: null,
        },
      });

      await sleep(500);
    } finally {
      // Reset this shortly after the modal is closed so that if the user opens
      // it again, they can pick a different option:
      setIsAuthenticating(false);
    }
  }, []);

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

      // TODO: What if email is not confirmed yet?

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
    } catch (error) {
      console.log(error);
      toast.error("Error checking email");
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  /*
  useEffect(() => {
    navigate("/", { search: { error: "test error", error_description: "test error description"}})
  }, []);
  */

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const emailInputButton = (
    <InputButton
      type="submit"
      label="Next" />
  );

  return (
    <OnboardingCard
      headerText={recoverableAccount ? "Select new sign in method" : "Sign up or Sign in"}
      hasBackButton={false}
      isLoading={ isViewLoading }
      onSubmit={ handleCheckEmail }>

      <TextInput
        name="email"
        placeholder="Enter your email"
        inputRef={emailInputRef}
        disabled={areButtonsDisabled}
        endSlot={emailInputButton}
      />

      <Divider text={"OR"} />

      <Row>
        <Button
          variant="outlined"
          size="md"
          isDisabled={areButtonsDisabled}
          onClick={() => handleAuthenticate("GOOGLE")}>
          <GoogleIcon fontSize={24} />
        </Button>
        {EMBEDDED_HIDE_BE ||
        (!!window.arweaveWallet?.walletName && window.arweaveWallet?.walletName !== "ArConnect") ? null : (
          <Button
            variant="outlined"
            size="md"
            isDisabled={areButtonsDisabled}
            onClick={handleNativeWallet}>
            <Wander2Icon fontSize={24} />
          </Button>
        )}
      </Row>

      <Button
        variant="outlined"
        isFullWidth
        isDisabled={areButtonsDisabled}
        icon={<SocialsIcon fontSize={24} />}
        href="/auth/more-providers">
        More options
      </Button>

      { !recoverableAccount ? (
        <Row style={{ gap: "4px" }}>
          <Text variant={"bodySm"}>{"Can't sign in?"}</Text>
          <Button
            variant="link"
            isDisabled={areButtonsDisabled}
            href="/auth/recover-account"
            size="sm">
            Recover account
          </Button>
        </Row>
      ) : null }

    </OnboardingCard>
  );
}
