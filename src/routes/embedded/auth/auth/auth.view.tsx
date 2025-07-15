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
  RecoverHeaderIcon,
  Snackbar,
} from "~components/embed";
import React, { useCallback, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { isValidEmail } from "~utils/email";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { sleep } from "~utils/promises/sleep";
import { EMBEDDED_HIDE_BE, EMBEDDED_INJECTED_BE } from "~utils/embedded/iframe.utils";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import type { OAutProviderType } from "~utils/embedded/embedded.types";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { PersistentStorage, useStorage } from "~utils/storage";
import { StorageKeys } from "~utils/storage/storage.constants";
import type { PreferredEmailAuth } from "~utils/auth/auth.types";

export function AuthEmbeddedView() {
  const { navigate } = useLocation();

  const { email, isAlreadyRegistered: isAlreadyRegisteredParam } = useSearchParams<{
    email: string;
    isAlreadyRegistered: string;
  }>();

  const { authStatus, authenticate, recoverableAccount } = useEmbedded();

  const [isUsingNativeWallet, setIsUsingNativeWallet] = useStorage<boolean>(
    {
      key: StorageKeys.CONNECT.AUTH.IS_USING_BE,
      instance: PersistentStorage,
    },
    (storedValue, isHydrated) => {
      if (!isHydrated) return undefined;

      return storedValue === undefined ? EMBEDDED_INJECTED_BE : storedValue;
    },
  );

  const [preferredEmailAuth] = useStorage<PreferredEmailAuth | undefined>({
    key: StorageKeys.CONNECT.AUTH.PREFERRED_EMAIL_AUTH,
    instance: PersistentStorage,
  });

  // Input refs:

  const emailInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    isAuthenticating ||
    isCheckingEmail;

  const isViewLoading = areButtonsDisabled && !isCheckingEmail;

  // Handlers:

  const handleAuthenticate = useCallback(async (authProviderType: OAutProviderType) => {
    try {
      setIsAuthenticating(true);
      await authenticate(authProviderType);
    } catch (error) {
      toast.error(getFriendlyAuthErrorMessage(error, `Error signing in with ${authProviderType}`));
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
      setIsUsingNativeWallet(true);
    }
  }, []);

  const handleCheckEmail = useCallback(
    async (e: React.FormEvent) => {
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
          isAlreadyRegisteredParam === "0"
            ? false
            : !!data || error?.message === "An account with this email already exists, but it is not using a password.";

        if (error && error.message !== "An account with this email already exists, but it is not using a password.") {
          toast.error(getFriendlyAuthErrorMessage(error, error.message || "Error checking email"));
          return;
        }

        // In order to make sure we hide the "Use password instead" link to both new and unverified users, the RPC call above would need to check whether the
        // specific email is verified too. Passing around the `isAlreadyRegistered` URL param as we are doing is less reliable.

        navigate(
          !isAlreadyRegistered || preferredEmailAuth !== "password"
            ? EmbeddedPaths.AuthEmailOtp
            : EmbeddedPaths.AuthEmailSignInPassword,
          {
            search: { email, isAlreadyRegistered: isAlreadyRegistered ? "1" : "0" },
          },
        );
      } catch (error) {
        toast.error(getFriendlyAuthErrorMessage(error, "Error checking email"));
      } finally {
        setIsCheckingEmail(false);
      }
    },
    [preferredEmailAuth, isAlreadyRegisteredParam],
  );

  const emailInputButton = <InputButton type="submit" label="Next" loading={isCheckingEmail} />;
  const showWanderExtensionButton = !EMBEDDED_HIDE_BE && window.arweaveWallet?.walletName === "ArConnect";
  const showWanderExtensionMessage = showWanderExtensionButton && isUsingNativeWallet;

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  return (
    <OnboardingCard
      headerIcon={recoverableAccount ? <RecoverHeaderIcon /> : null}
      headerText={recoverableAccount ? "Select New Sign In Method" : "Sign Up or Sign In"}
      hasBackButton={false}
      isLoading={isViewLoading}
      onSubmit={handleCheckEmail}>
      {showWanderExtensionMessage ? (
        <Snackbar
          variant="info"
          children={`${window.arweaveWallet?.walletName ? `${window.arweaveWallet?.walletName} (browser extension) connected` : "a browser extension wallet"}. Authenticate to use Wander Connect.`}
        />
      ) : null}

      <TextInput
        name="email"
        placeholder="Enter your email"
        defaultValue={email}
        inputRef={emailInputRef}
        disabled={areButtonsDisabled}
        endSlot={emailInputButton}
        autoFocus
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

        {showWanderExtensionButton ? (
          <Button variant="outlined" size="md" isDisabled={areButtonsDisabled} onClick={handleNativeWallet}>
            <Wander2Icon fontSize={24} />
          </Button>
        ) : null}
      </Row>

      <Button
        variant="outlined"
        isFullWidth
        isDisabled={areButtonsDisabled}
        icon={<SocialsIcon fontSize={24} />}
        href="/auth/more-providers">
        More options
      </Button>

      {!recoverableAccount ? (
        <Text variant="bodySm" alignment="center">
          Can't sign in?{" "}
          <Button variant="link" isDisabled={areButtonsDisabled} href={EmbeddedPaths.AuthRecoverAccount}>
            Recover account
          </Button>
        </Text>
      ) : null}
    </OnboardingCard>
  );
}
