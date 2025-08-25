import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button, Text, TextInput } from "~components/embed";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { EditIcon } from "@iconicicons/react";
import { getFriendlyAuthErrorMessage } from "~utils/authentication/authentication.utils";
import { PersistentStorage, useStorage } from "~utils/storage";
import type { PreferredEmailAuth } from "~utils/auth/auth.types";
import { StorageKeys } from "~utils/storage/storage.constants";

export function AuthEmailSignInPasswordEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus, authenticate } = useEmbedded();

  const [_, setPreferredEmailAuth] = useStorage<PreferredEmailAuth | undefined>({
    key: StorageKeys.CONNECT.AUTH.PREFERRED_EMAIL_AUTH,
    instance: PersistentStorage,
  });

  // Input refs:

  const passwordInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const isViewLoading =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;
  const areButtonsDisabled = isViewLoading;

  // Handlers:

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        const password = passwordInputRef.current?.value || "";

        if (!password) {
          toast.error("Please enter an email and password");
          return;
        }

        setIsAuthenticating(true);

        await authenticate({
          method: "signInWithPassword",
          email,
          password,
        });

        setPreferredEmailAuth("password");
      } catch (error) {
        if (error.code === "email_not_confirmed") {
          navigate(EmbeddedPaths.AuthEmailVerify);
        } else {
          toast.error(getFriendlyAuthErrorMessage(error, error.message || "Error signing in"));
        }
      } finally {
        setIsAuthenticating(false);
      }
    },
    [email],
  );

  useEffect(() => {
    if (!email) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No email search param. The router should have taken care of this.");
      } else {
        navigate(EmbeddedPaths.Auth);
      }
    }
  }, [email]);

  const editIcon = (
    <EditIcon
      aria-label="Edit"
      style={{
        width: 22,
        height: 22,
        color: "var(--text-color-tertiary)",
      }}
    />
  );

  const emailInputButton = (
    <InputButton
      icon={editIcon}
      disabled={areButtonsDisabled}
      onClick={() => navigate("/auth", { search: { email } })}
    />
  );

  return (
    <OnboardingCard
      headerText="Enter your password"
      isLoading={isViewLoading}
      onBackButtonClick={() => navigate(`/auth`)}
      onSubmit={handleEmailSignIn}>
      <TextInput
        name="email"
        placeholder="Enter your email"
        value={email}
        disabled={areButtonsDisabled}
        readOnly
        endSlot={emailInputButton}
      />

      <PasswordInput
        name="password"
        placeholder="Enter your password"
        inputRef={passwordInputRef}
        disabled={areButtonsDisabled}
        autoFocus
      />

      <Button type="submit" isFullWidth isDisabled={areButtonsDisabled}>
        Sign in
      </Button>

      <Text variant="bodySm" alignment="center">
        Forgot your password?{" "}
        <Button variant="link" isDisabled={areButtonsDisabled} href={EmbeddedPaths.AuthRecoverAccount}>
          Recover account
        </Button>
      </Text>

      <Text variant="bodySm" alignment="center">
        <Button variant="link" isDisabled={areButtonsDisabled} href={EmbeddedPaths.AuthEmailOtp}>
          Request email access code instead
        </Button>
      </Text>
    </OnboardingCard>
  );
}
