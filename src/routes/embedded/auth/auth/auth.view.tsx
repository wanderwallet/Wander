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

export function AuthEmbeddedView() {
  const { authenticate, authStatus } = useEmbedded();

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

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
          icon={
            <KeyIcon fontSize={24} onClick={() => authenticate("passkey")} />
          }
          isLoading={
            authStatus === "unknown" ||
            authStatus === "loading" ||
            authStatus === "authLoading"
          }
        >
          Create new wallet
        </Button>
        <Divider text={"OR"} />
        <Row>
          <Button
            variant="outlined"
            size="md"
            onClick={() => authenticate("google")}
          >
            <GoogleIcon fontSize={24} />
          </Button>
          <Button variant="outlined" size="md" href="/auth/more-providers">
            <Wander2Icon fontSize={24} />
          </Button>
        </Row>
        <Button
          variant="outlined"
          isFullWidth
          icon={<SocialsIcon fontSize={24} />}
          onClick={() => alert("Not implemented")}
        >
          More options
        </Button>
        <Row alignment="center">
          <Text variant={"bodySm"}>{"Can’t sign in?"}</Text>
          <Button variant="link" href="/auth/recover-account" size="sm">
            Recover account
          </Button>
        </Row>
      </Box>
    </Card>
  );
}
