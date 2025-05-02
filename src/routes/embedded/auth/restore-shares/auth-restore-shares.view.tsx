import {
  Box,
  Button,
  Card,
  WalletIcon,
  SeedIcon,
  KeyIcon,
  WanderFooter,
  Text
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import Wallet from "url:/assets/embed/wallet.svg";
import { Flex } from "~components/common/Flex";

export function AuthRestoreSharesEmbeddedView() {
  const { navigate, back } = useLocation();
  return (
    <Card
      headerText=""
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(`/auth`)}
      size="auto"
    >
      <Box>
        <Flex
          padding="16px 0px"
          direction="column"
          align="center"
          justify="center"
          gap={16}
        >
          <img src={Wallet} alt="Wallet" width={73} height={48} />
          <Text
            variant="headingMd"
            style={{ color: "var(--text-color-primary)" }}
          >
            Recover your account
          </Text>
          <Text alignment="center" variant="bodyMd">
            Select a method for logging in on new devices and recovering your
            account.
          </Text>
        </Flex>
        {/* <Button
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
        </Button> */}
        {/* <Button
          variant="outlined"
          isFullWidth
          icon={<DropboxIcon fontSize={24} />}
          onClick={() => alert("Not implemented.")}
        >
          Dropbox
        </Button> */}
        <Button
          variant="outlined"
          isFullWidth
          icon={<WalletIcon fontSize={24} />}
          href="#/auth/restore-shares/recovery-file"
        >
          Import Recovery File
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<SeedIcon fontSize={24} />}
          href="#/auth/recover-account/seedphrase"
        >
          Enter Seedphrase
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<KeyIcon fontSize={24} />}
          href="#/auth/recover-account/keyfile"
        >
          Import keyfile
        </Button>
      </Box>
    </Card>
  );
}
