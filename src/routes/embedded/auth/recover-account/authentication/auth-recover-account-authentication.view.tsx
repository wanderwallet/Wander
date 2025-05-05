import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useState, useCallback, useRef } from "react";
import {
  Card,
  Button,
  KeyIcon,
  GoogleIcon,
  SocialsIcon,
  WanderFooter,
  Box,
  Divider,
  Row,
  TextInput,
  Wander2Icon
} from "~components/embed/ui";
import type { AuthProviderType } from "embed-api";
import { toast } from "react-toastify";
import { getSupabaseClient } from "~utils/embedded/embedded.utils";

export function AuthRecoverAccountAuthenticationEmbeddedView() {
  const [selectedAuthProviderType, setSelectedAuthProviderType] =
    useState<AuthProviderType | null>(null);
  const {
    recoverableAccounts,
    recoverAccount,
    authenticate,
    authStatus,
    accountToRecover
  } = useEmbedded();

  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();

  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !!selectedAuthProviderType;

  const accountToRecoverId = accountToRecover?.userId;

  const handleAuthenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      setSelectedAuthProviderType(authProviderType);
      try {
        await authenticate(
          authProviderType,
          emailInputRef.current?.value || "",
          passwordInputRef.current?.value || ""
        );
        setSelectedAuthProviderType(null);
      } catch (error) {
        toast.error(`Error signing in with ${authProviderType}`);
      } finally {
        setSelectedAuthProviderType(null);
      }
    },
    []
  );

  const handleEmailSignup = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();

      const { error, data } = await supabase.auth.signUp({
        email: emailInputRef.current?.value || "",
        password: passwordInputRef.current?.value || ""
      });

      console.log({ error, data });
    } catch (error) {
      toast.error("Error signing up");
    }
  }, []);

  const handleEmailSignIn = useCallback(async () => {
    try {
      const supabase = await getSupabaseClient();
      const { error, data } = await supabase.auth.signInWithPassword({
        email: emailInputRef.current?.value || "",
        password: passwordInputRef.current?.value || ""
      });

      console.log({ error, data });
    } catch (error) {
      toast.error("Error signing in");
    }
  }, []);

  return (
    <Card
      headerText="Select new sign in method"
      footerElement={<WanderFooter />}
      hasBackButton={false}
      size="auto"
    >
      <Box>
        <TextInput
          ref={emailInputRef}
          placeholder="E-Mail"
          isDisabled={areButtonsDisabled}
        />
        <br />
        <TextInput
          ref={passwordInputRef}
          placeholder="Password"
          isDisabled={areButtonsDisabled}
          isSecure
        />
        <br />
        <Button
          isFullWidth
          onClick={() => handleEmailSignup()}
          icon={<KeyIcon fontSize={24} />}
          isDisabled={areButtonsDisabled}
        >
          Email Sign Up
        </Button>
        <Button
          isFullWidth
          onClick={() => handleEmailSignIn()}
          icon={<KeyIcon fontSize={24} />}
          isDisabled={areButtonsDisabled}
        >
          Email Sign In
        </Button>
        <Divider text={"OR"} />
        <Row>
          <Button
            variant="outlined"
            size="md"
            isLoading={selectedAuthProviderType === "GOOGLE"}
            isDisabled={areButtonsDisabled}
            onClick={() => handleAuthenticate("GOOGLE")}
          >
            <GoogleIcon fontSize={24} />
          </Button>
          <Button variant="outlined" size="md" isDisabled>
            <Wander2Icon fontSize={24} />
          </Button>
        </Row>
        <Button
          variant="outlined"
          isFullWidth
          isDisabled
          icon={<SocialsIcon fontSize={24} />}
          href="#/auth/recover-account/more-authentication"
        >
          More options
        </Button>
      </Box>
    </Card>
  );
}
