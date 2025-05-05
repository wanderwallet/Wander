import { useState } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  Box,
  Button,
  Card,
  Checkbox,
  WarningCircledIcon,
  WanderFooter
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";

export function AccountBackupSharesReminderEmbeddedView() {
  const { currentWallet, skipBackUp } = useEmbedded();
  const { navigate, back } = useLocation();
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
      headerIcon={<WarningCircledIcon />}
      headerText="Wallet backup"
      subtitle={"Secure your wallet by backing it up"}
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      size="auto"
    >
      <Box>
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
