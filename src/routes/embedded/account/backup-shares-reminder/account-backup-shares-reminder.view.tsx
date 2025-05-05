import { useState } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  Box,
  Button,
  Card,
  Checkbox,
  WanderFooter,
  Copyable,
  Text
} from "~components/embed/ui";
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AccountBackupSharesReminderEmbeddedView() {
  const { currentWallet, skipBackUp } = useEmbedded();
  const isMandatoryReminder =
    currentWallet.totalExports === 0 &&
    currentWallet.totalBackups === 0 &&
    !currentWallet.doNotAskAgainSetting;

  const [isLoading, setIsLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleSkipClicked = async () => {
    setIsLoading(true);

    await skipBackUp(isChecked);

    // TODO: Temp fix until the button can handle onClick + href automatically:
    navigate(EmbeddedPaths.WalletHomeEmbeddedView);
  };

  return (
    <Card
      headerText="Wallet backup"
      subtitle={"Secure your wallet by backing it up"}
      footerElement={<WanderFooter />}
      hasBackButton={false}
      hasCloseButton={true}
      size="auto"
    >
      <Box>
        <Text
          variant="bodySm"
          style={{
            marginBottom: 24,
            marginTop: -16,
            color: "#0D6CE9",
            cursor: "pointer"
          }}
        >
          Why should I back up my wallet?
        </Text>
        <Copyable
          style={{ padding: "0", marginBottom: 24, marginTop: 8 }}
          isFullWidth
          label="Your wallet address"
          value={currentWallet.address}
          onClick={() => {
            copy(currentWallet.address);
          }}
        />
        <Button
          variant="primary"
          isDisabled={isLoading}
          isFullWidth
          href="#/account/backup-shares"
        >
          Backup now
        </Button>
        {isMandatoryReminder ? (
          <Button
            variant="secondary"
            isDisabled={isLoading}
            isFullWidth
            href="#/wallet"
            onClick={handleSkipClicked}
          >
            Backup later
          </Button>
        ) : (
          <Button variant="secondary" isFullWidth href="#/wallet">
            Cancel
          </Button>
        )}
        {isMandatoryReminder && (
          <Checkbox
            style={{ padding: 0, margin: 0, marginTop: 24 }}
            label="Don't show this again"
            description="Note: you can set this up on the settings page"
            isDisabled={isLoading}
            handleChange={() => setIsChecked(!isChecked)}
            isChecked={isChecked}
          />
        )}
      </Box>
    </Card>
  );
}
