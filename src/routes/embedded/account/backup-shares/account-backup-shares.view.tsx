import { useCallback, useState } from "react";
import {
  Box,
  Button,
  Card,
  Row,
  WanderIcon,
  Text,
  AppleIcon,
  DropboxIcon,
  GDriveIcon,
  SeedIcon,
  KeyShareIcon,
  KeyIcon
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupSharesEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { currentWallet, generateRecoveryAndDownload } = useEmbedded();

  const handleGenerateRecoveryAndDownload = useCallback(() => {
    try {
      setLoading(true);
      generateRecoveryAndDownload();
      setLoading(false);
    } catch (error) {
      alert(error);
      setLoading(false);
    }
  }, [generateRecoveryAndDownload]);

  // TODO: What if the user already has more than 3 backup shares?

  // TODO: Do we download one file for the whole account or a file per wallet?

  // TODO: Show confirmation message once backed up and keep the file in-memory
  // in case the button is clicked again.

  // TODO: Add an option to encrypt with a password

  // TODO: Redirect user to backup confirmation next or show some kind of confirmation or just redirect home?

  return (
    <Card
      headerText="Wallet backup"
      subtitle="Select a method to back up your wallet which can be used to sign in on a new device or recover your wallet"
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={back}
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
          icon={<KeyShareIcon fontSize={24} />}
          isLoading={
            isLoading.calledId === "PrivateKey" && isLoading.status === true
          }
          onClick={() => handleOnClick("PrivateKey")}
        >
          Export Private Key Share
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
          isLoading={
            isLoading.calledId === "Seedphrase" && isLoading.status === true
          }
          onClick={() => handleOnClick("Seedphrase")}
        >
          Copy Seedphrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<GDriveIcon fontSize={24} />}
          onClick={() => handleOnClick("GDrive")}
          isLoading={
            isLoading.calledId === "GDrive" && isLoading.status === true
          }
        >
          Backup to Google Drive
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          onClick={() => handleOnClick("Apple")}
          isLoading={
            isLoading.calledId === "Apple" && isLoading.status === true
          }
        >
          Backup to iCloud
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<DropboxIcon fontSize={24} />}
          onClick={() => handleOnClick("Dropbox")}
          isLoading={
            isLoading.calledId === "Dropbox" && isLoading.status === true
          }
        >
          Backup to Dropbox
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          isLoading={loading}
          isDisabled={loading}
          onClick={handleGenerateRecoveryAndDownload}
        >
          Export Recovery File
        </Button>
        <Button variant="link" isFullWidth>
          Why should I back up my account?
        </Button>
      </Box>
    </Card>
  );
}
