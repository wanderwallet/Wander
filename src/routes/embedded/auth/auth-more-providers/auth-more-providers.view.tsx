import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
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

export function AuthMoreProvidersEmbeddedView() {
  const { authenticate } = useEmbedded();

  // TODO: Remember last selection and highlight that one / show it in the main screen (not in "More")

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
      hasCloseButton={false}
      hasShadow={true}
      size="auto"
    >
      <Box>
        <Button
          variant="outlined"
          isFullWidth
          icon={<FacebookIcon fontSize={24} />}
          onClick={() => authenticate("emailPassword")}
        >
          Email & Password
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<FacebookIcon fontSize={24} />}
          onClick={() => authenticate("facebook")}
        >
          Continue with Facebook
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          onClick={() => authenticate("apple")}
        >
          Continue with Apple
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<TwitterIcon fontSize={24} />}
          onClick={() => authenticate("x")}
        >
          Continue with X
        </Button>
      </Box>
    </Card>
  );
}
