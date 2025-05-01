import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  WanderFooter,
  Snackbar,
  WarningIcon
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupCopySeedphraseEmbeddedView() {
  const { navigate } = useLocation();
  const { currentWallet } = useEmbedded();
  const [seedphrase, setSeedphrase] = useState("");

  useEffect(() => {}, [currentWallet.id]);

  return (
    <Card
      headerText="Copy seedphrase"
      subtitle="Save your 12 word seedphrase to a password manager, or write it down."
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
        <Box
          style={{
            background: "rgba(255, 255, 255, 0.01)",
            backdropFilter: "blur(7px)",
            borderRadius: 10,
            padding: 16,
            flexWrap: "wrap"
          }}
        >
          sdfsdfsd
        </Box>
        <Box style={{ padding: 0 }}>
          <Button isFullWidth onClick={() => {}}>
            Done
          </Button>
        </Box>
      </Box>
    </Card>
  );
}
