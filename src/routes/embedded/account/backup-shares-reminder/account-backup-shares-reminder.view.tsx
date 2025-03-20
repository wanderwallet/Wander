import { useState } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Row,
  WanderIcon,
  Text,
  WarningCircledIcon
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupSharesReminderEmbeddedView() {
  const { currentWallet, skipBackUp } = useEmbedded();
  const { navigate } = useLocation();
  const isMandatoryReminder =
    currentWallet.totalExports === 0 &&
    currentWallet.totalBackups === 0 &&
    !currentWallet.doNotAskAgainSetting;

  const [isChecked, setIsChecked] = useState(false);

  const handleSkipClicked = async () => {
    await skipBackUp(isChecked);
    navigate(isChecked ? "/" : "/account");
  };

  const address = wallets[0].address;

  return (
    <Card
      headerIcon={!hasUnpartitionedState && <WarningCircledIcon />}
      headerText="Wallet backup"
      subtitle={
        !hasUnpartitionedState
          ? "Your browser does not support unpartitioned state. Back up your wallet to access it on new apps."
          : "Secure your wallet by backing it up"
      }
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
            href="#/account"
            onClick={handleSkipClicked}
          >
            Backup later
          </Button>
        ) : (
          <Button variant="secondary" isFullWidth href="#/account">
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
