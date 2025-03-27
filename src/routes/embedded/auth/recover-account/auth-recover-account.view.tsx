import {
  Box,
  Button,
  Card,
  KeyIcon,
  RecoverHeaderIcon,
  Row,
  SeedIcon,
  Text,
  WanderIcon
} from "~components/embed/ui";

export function AuthRecoverAccountEmbeddedView() {
  return (
    <Card
      headerIcon={<RecoverHeaderIcon />}
      headerText="Recover your account"
      subtitle="After recovery, all your devices are logged out and your account recovery files are invalided. You'll have to download a new one."
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
      hasCloseButton={true}
      onCloseButtonClick={() => {
        window.location.href = "/auth";
      }}
      size="auto"
    >
      <Box>
        <Button
          href="#/auth/recover-account/keyfile"
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
        >
          Import Private Key
        </Button>
        <Button
          href="#/auth/recover-account/seedphrase"
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
        >
          Enter Seedphrase
        </Button>
      </Box>
    </Card>
  );
}
