import { FolderShield, Key01 } from "@untitled-ui/icons-react";
import copy from "copy-to-clipboard";
import {
  Box,
  Button,
  Card,
  WanderFooter,
  Copyable,
  WarningIcon,
  Snackbar
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupFullWalletEmbeddedView() {
  const { navigate } = useLocation();
  const { currentWallet, downloadKeyfile } = useEmbedded();

  return (
    <Card
      headerText="Backup your full wallet"
      subtitle="Download your keyfile or copy your seedphrase to export your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      hasCloseButton={true}
      onCloseButtonClick={() => {
        <Link to="/wallet" />;
      }}
      size="auto"
    >
      <Box style={{ gap: 28 }}>
        <Snackbar
          isFullWidth
          icon={<WarningIcon />}
          text="Do not share this with anyone."
          backgroundColor="#F2DC1320"
          borderColor="#F2DC1320"
          textColor="#121212"
          iconColor="#BD8802"
        />
        <Copyable
          style={{ padding: "0" }}
          isFullWidth
          label="Your wallet address"
          value={currentWallet.address}
          onClick={() => {
            copy(currentWallet.address);
          }}
        />
        <Box style={{ padding: 0 }}>
          <Button
            variant="outlined"
            isFullWidth
            icon={<Key01 fontSize={24} />}
            onClick={downloadKeyfile}
          >
            Export Keyfile
          </Button>
          <Button
            variant="outlined"
            isFullWidth
            icon={<FolderShield fontSize={24} />}
            onClick={() =>
              navigate("/account/backup-full-wallet/copy-seedphrase")
            }
          >
            Copy Seedphrase
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
