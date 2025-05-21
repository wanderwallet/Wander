import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { toast } from "react-toastify";
import { Button, Text, TextInput } from "~components/embed";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";
import { useLocation, useSearchParams } from "~wallets/router/router.utils";
import { Flex } from "~components/common/Flex";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { PasswordInput } from "~components/embed/ui/atoms/password-input";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { InputButton } from "~components/embed/ui/atoms/input-button/InputButton";
import { EditIcon } from "@iconicicons/react";

export function AuthEmailSignInEmbeddedView() {
  const { navigate } = useLocation();
  const { email } = useSearchParams<{ email: string }>();
  const { authStatus } = useEmbedded();

  // Input refs:

  const passwordInputRef = useRef<HTMLInputElement>();

  // Loading state:

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const areButtonsDisabled =
    authStatus === "unknown" || authStatus === "loading" || authStatus === "authLoading" || isAuthenticating;

  const isViewLoading = areButtonsDisabled;

  // Handlers:

  /*
  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !authEmail ||
    !passwordInput.state;
  */

  const authStatusRef = useRef(authStatus);

  const handleEmailSignin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const password = passwordInputRef.current?.value || "";

    try {
      if (!password) {
        toast.error("Please enter an email and password");
        return;
      }

      setIsAuthenticating(true);

      // TODO: Call authenticate instead.

      const supabase = await getSupabaseClient();

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        if (error.code === "email_not_confirmed") {
          navigate(EmbeddedPaths.AuthEmailVerify);
        }
        return;
      }

      const interval = setInterval(() => {
        if (authStatusRef.current === "unlocked") {
          navigate(EmbeddedPaths.WalletHomeEmbeddedView);
        }
      }, 1000);

      await new Promise((resolve) => {
        const interval = setInterval(() => {
          if (authStatusRef.current === "unlocked") {
            clearInterval(interval);
            resolve(true);
          }
        }, 1000);
      });

      return () => clearInterval(interval);
    } catch (error) {
      toast.error("Error signing up");
    } finally {
      setIsAuthenticating(false);
    }
  }, [email]);

  useEffect(() => {
    authStatusRef.current = authStatus;
  }, [authStatus]);

  useEffect(() => {
    if (!email) {
      if (process.env.NODE_ENV === "development") {
        throw new Error("No email search param. The router should have taken care of this.")
      } else {
        navigate(EmbeddedPaths.Auth)
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
      }}/>
  );

  const emailInputButton = (
    <InputButton
      icon={editIcon}
      disabled={ areButtonsDisabled }
      onClick={ () => navigate("/auth", { search: { email }}) } />
  );

  return (
    <OnboardingCard
      headerText="Enter your password"
      isLoading={ isViewLoading }
      onBackButtonClick={() => navigate(`/auth`)}
      onSubmit={ handleEmailSignin }>

      <TextInput
        name="email"
        placeholder="Enter your email"
        value={ email }
        disabled={areButtonsDisabled}
        readOnly
        endSlot={emailInputButton}
      />

      <PasswordInput
        name="password"
        placeholder="Enter your password"
        inputRef={passwordInputRef}
        disabled={areButtonsDisabled} />

      <Button type="submit" isFullWidth isDisabled={areButtonsDisabled}>
        Sign in
      </Button>

      <Flex direction="row" gap={4} width="100%" justify="center">
        <Text variant={"bodySm"} alignment="left">
          Forgot your password?
        </Text>

        <Button
          style={{ width: "auto" }}
          variant="link"
          alignment="left"
          isFullWidth
          isDisabled={areButtonsDisabled}
          href={EmbeddedPaths.AuthRecoverAccount}>
          Recover account
        </Button>
      </Flex>

    </OnboardingCard>
  );
}
