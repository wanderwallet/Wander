import {
  AppleIcon,
  Box,
  Button,
  Card,
  Row,
  WalletIcon,
  WanderIcon,
  Text,
  GDriveIcon,
  DropboxIcon,
  SeedIcon,
  KeyIcon
} from "~components/embed/ui";

export function AuthRestoreSharesEmbeddedView() {
  return (
    <Card
      headerText="Restore shares / wallet"
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
          variant="outlined"
          isFullWidth
          icon={<GDriveIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          Google Drive
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          iCloud
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<DropboxIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          Dropbox
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<WalletIcon fontSize={24} />}
          href="#/auth/restore-shares/recovery-file"
        >
          Upload Account Recovery File
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
          href="#/auth/import-seedphrase"
        >
          Enter Seed Phrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          href="#/auth/import-keyfile"
        >
          Import Private Key
        </Button>
      </Box>
    </Card>
  );
}
