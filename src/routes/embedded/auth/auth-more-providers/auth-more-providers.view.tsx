import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  AppleIcon,
  Box,
  Button,
  Card,
  FacebookIcon,
  Row,
  Text,
  TwitterIcon,
  WanderIcon
} from "~components/embed";
import { useCallback, useState } from "react";
import type { AuthMethod } from "~utils/authentication/fakeDB";

export function AuthMoreProvidersEmbeddedView() {
  const { authenticate } = useEmbedded();
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
      subtitle="Select a method to authenticate"
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={false}
      size="auto"
    >
      <Box>
        <Button
          variant="outlined"
          isFullWidth
          icon={<FacebookIcon fontSize={24} />}
          onClick={() => handleAuthenticate("facebook")}
          isLoading={
            isLoading.calledId === "facebook" && isLoading.status === true
          }
        >
          Continue with Facebook
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          onClick={() => handleAuthenticate("apple")}
          isLoading={
            isLoading.calledId === "apple" && isLoading.status === true
          }
        >
          Continue with Apple
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<TwitterIcon fontSize={24} />}
          onClick={() => handleAuthenticate("x")}
          isLoading={isLoading.calledId === "x" && isLoading.status === true}
        >
          Continue with X
        </Button>
      </Box>
    </Card>
  );
}
