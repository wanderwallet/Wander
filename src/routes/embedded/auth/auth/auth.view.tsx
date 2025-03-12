import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  Box,
  Button,
  Card,
  Divider,
  GoogleIcon,
  KeyIcon,
  TextInput,
  Row,
  SocialsIcon,
  Text,
  Wander2Icon,
  WanderIcon
} from "~components/embed";
import { useCallback, useRef, useState } from "react";
import type { AuthProviderType } from "embed-api";
import { supabase } from "~utils/embedded/embedded.utils";

export function AuthEmbeddedView() {
  const { authenticate, authStatus } = useEmbedded();

  const [selectedAuthProviderType, setSelectedAuthProviderType] =
    useState<AuthProviderType | null>(null);

  const areButtonsDisabled =
    authStatus === "unknown" ||
    authStatus === "loading" ||
    authStatus === "authLoading" ||
    !!selectedAuthProviderType;

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const emailInputRef = useRef<HTMLInputElement>();
  const passwordInputRef = useRef<HTMLInputElement>();

  const handleAuthenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      setSelectedAuthProviderType(authProviderType);
      await authenticate(
        authProviderType,
        emailInputRef.current?.value || "",
        passwordInputRef.current?.value || ""
      );
      setSelectedAuthProviderType(null);
    },
    []
  );

  const handleEmailSignup = useCallback(async () => {
    const { error, data } = await supabase.auth.signUp({
      email: emailInputRef.current?.value || "",
      password: passwordInputRef.current?.value || ""
    });

    console.log({ error, data });
  }, []);

  const handleEmailSignIn = useCallback(async () => {
    const { error, data } = await supabase.auth.signInWithPassword({
      email: emailInputRef.current?.value || "",
      password: passwordInputRef.current?.value || ""
    });

    console.log({ error, data });
  }, []);

  return (
    <Card
      headerText="Sign Up or Sign In"
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={false}
      //   hasCloseButton={false}
      size="auto"
    >
      <Box>
        <TextInput placeholder="E-Mail" ref={emailInputRef} />
        <TextInput placeholder="Password" ref={passwordInputRef} isSecure />

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
          isDisabled={areButtonsDisabled}
          icon={<SocialsIcon fontSize={24} />}
          href="/auth/more-providers"
        >
          More options
        </Button>
        <Row alignment="center" justifyContent="center">
          <Text variant={"bodySm"}>{"Can’t sign in?"}</Text>
          <Button variant="link" href="/auth/recover-account" size="sm">
            Recover account
          </Button>
        </Row>
      </Box>
    </Card>
  );
}
