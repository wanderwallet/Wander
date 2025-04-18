import { useCallback, useState } from "react";
import { Box, Button, Card, KeyIcon, WanderFooter } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupSharesEmbeddedView() {
  const [isLoading, setIsLoading] = useState({
    calledId: "",
    status: false
  });
  const { navigate } = useLocation();
  const { currentWallet, generateRecoveryAndDownload, copySeedphrase } =
    useEmbedded();
  const walletAddress = currentWallet.address;

  const handleOnClick = useCallback(
    async (
      method: "GDrive" | "Apple" | "Dropbox" | "PrivateKey" | "Seedphrase"
    ) => {
      const setLoadingState = (status: boolean) =>
        setIsLoading({ calledId: method, status });

      try {
        setLoadingState(true);

        switch (method) {
          case "PrivateKey":
            await generateRecoveryAndDownload();
            break;

          case "Seedphrase":
            await copySeedphrase();
            break;

          case "GDrive":
          case "Apple":
          case "Dropbox":
            console.log("Not implemented yet");
            break;

          default:
            console.log("Method doesn't exist");
        }
      } catch (error) {
        alert(error);
      } finally {
        setLoadingState(false);
      }
    },
    [generateRecoveryAndDownload, copySeedphrase, walletAddress]
  );

  const handleGenerateRecoveryAndDownload = useCallback(async () => {
    try {
      setIsLoading({
        calledId: "RecoveryFile",
        status: true
      });
      await generateRecoveryAndDownload();
      setIsLoading({
        calledId: "RecoveryFile",
        status: false
      });
    } catch (error) {
      alert(error);
      setIsLoading({
        calledId: "RecoveryFile",
        status: false
      });
    }
  }, [generateRecoveryAndDownload]);

  const handleUnimplementedFeature = useCallback(() => {
    alert("Feature not implemented yet.");
  }, []);

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
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      hasCloseButton={true}
      onCloseButtonClick={() => {
        <Link to="/wallet" />;
      }}
      size="auto"
    >
      <Box>
        {/* <Button
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
        </Button> */}
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          isLoading={isLoading.calledId === "RecoveryFile" && isLoading.status}
          isDisabled={isLoading.calledId === "RecoveryFile" && isLoading.status}
          onClick={handleGenerateRecoveryAndDownload}
        >
          Export Recovery File
        </Button>
        <Button variant="link" isFullWidth onClick={handleUnimplementedFeature}>
          Why should I back up my account?
        </Button>
      </Box>
    </Card>
  );
}
