import { Box, Button, Card, KeyIcon, RecoverHeaderIcon, SeedIcon, WanderFooter } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRecoverAccountEmbeddedView() {
  const { navigate, back } = useLocation();
  return (
    <Card
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle="Select a method for logging in on new devices and recovering your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(`/auth`)}
      size="auto">
      <Box>
        <Button
          href="#/auth/recover-account/seedphrase"
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}>
          Enter Seedphrase
        </Button>
        <Button href="#/auth/recover-account/keyfile" variant="outlined" isFullWidth icon={<KeyIcon fontSize={24} />}>
          Import Keyfile
        </Button>
      </Box>
    </Card>
  );
}
