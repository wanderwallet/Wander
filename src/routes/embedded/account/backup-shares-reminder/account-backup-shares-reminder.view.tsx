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

export function AccountBackupSharesReminderEmbeddedView() {
  const { currentWallet, skipBackUp } = useEmbedded();
  const { navigate, back } = useLocation();
  const isMandatoryReminder =
    currentWallet.totalExports === 0 &&
    currentWallet.totalBackups === 0 &&
    !currentWallet.doNotAskAgainSetting;

  const [isChecked, setIsChecked] = useState(false);

  const handleSkipClicked = async () => {
    await skipBackUp(isChecked);
    navigate(isChecked ? "/" : "/wallet");
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
        <Button variant="primary" isFullWidth href="#/account/backup-shares">
          Backup now
        </Button>
        {isMandatoryReminder ? (
          <Button
            variant="secondary"
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
            handleChange={() => setIsChecked(!isChecked)}
            isChecked={isChecked}
          />
        )}
      </Box>
    </Card>
  );
}
