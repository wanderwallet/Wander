import {
  Box,
  Button,
  Card,
  Checkbox,
  Row,
  WanderIcon,
  Text,
  AppleIcon,
  DropboxIcon,
  GDriveIcon,
  KeyIcon,
  SeedIcon
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Link } from "~wallets/router/components/link/Link";

export function AccountBackupSharesEmbeddedView() {
  const { wallets, promptToBackUp, generateRecoveryAndDownload } =
    useEmbedded();
  const walletAddress = wallets[0].address;

  // TODO: What if the user already has more than 3 backup shares?

  // TODO: Do we download one file for the whole account or a file per wallet?

  // TODO: Show confirmation message once backed up and keep the file in-memory
  // in case the button is clicked again.

  // TODO: Add an option to encrypt with a password

  // TODO: Redirect user to backup confirmation next or show some kind of confirmation or just redirect home?

  return (
    <Card
      headerText="Account backup"
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
        <Link to="/account" />;
      }}
      size="auto"
    >
      <Box>
        <Button
          variant="outlined"
          isFullWidth
          icon={<GDriveIcon fontSize={24} />}
        >
          Backup to Google Drive
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
        >
          Backup to iCloud
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<DropboxIcon fontSize={24} />}
        >
          Backup to Dropbox
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          onClick={() => generateRecoveryAndDownload(walletAddress)}
        >
          Export Private Key
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
        >
          Copy Seedphrase
        </Button>
        <Button variant="link" isFullWidth>
          Why should I back up my account?
        </Button>
      </Box>
    </Card>
  );
}
