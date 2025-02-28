import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  Box,
  Button,
  Card,
  Divider,
  GoogleIcon,
  KeyIcon,
  Row,
  SocialsIcon,
  Text,
  Wander2Icon,
  WanderIcon
} from "~components/embed";
import { useCallback, useState } from "react";
import type { AuthMethod } from "~utils/authentication/fakeDB";

export function AuthEmbeddedView() {
  const { authenticate, authStatus } = useEmbedded();
  const [isLoading, setIsLoading] = useState({
    calledId: "",
    status: false
  });

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

  const handleAuthenticate = useCallback(async (authMethod: AuthMethod) => {
    setIsLoading({ calledId: authMethod, status: true });
    await authenticate(authMethod);
    setIsLoading({ calledId: "", status: false });
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
      hasCloseButton={false}
      size="auto"
    >
      <Box>
        <Button
          isFullWidth
          onClick={() => handleAuthenticate("passkey")}
          icon={<KeyIcon fontSize={24} />}
          isLoading={
            isLoading.calledId === "passkey" && isLoading.status === true
          }
        >
          Create new wallet
        </Button>
        <Divider text={"OR"} />
        <Row>
          <Button
            variant="outlined"
            size="md"
            isLoading={
              isLoading.calledId === "google" && isLoading.status === true
            }
            onClick={() => handleAuthenticate("google")}
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
          isLoading={isLoading.calledId === "more" && isLoading.status === true}
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
