import { useRef, useState } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import copy from "copy-to-clipboard";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Row,
  WanderIcon,
  Text,
  Copyable,
  WarningIcon,
  WarningCircledIcon
} from "~components/embed/ui";
import { useUnpartitionedStateCheck } from "~utils/embedded/utils/useUnpartitionedStateCheck";
import { useLocation } from "~wallets/router/router.utils";

export function AccountBackupSharesReminderEmbeddedView() {
  const { promptToBackUp, skipBackUp, wallets } = useEmbedded();
  const [isChecked, setIsChecked] = useState(false);
  const { back } = useLocation();
  const hasUnpartitionedState = useUnpartitionedStateCheck();
  const checkboxRef = useRef<HTMLInputElement>();

  const handleSkipClicked = () => {
    return skipBackUp(isChecked);
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
      size="auto"
    >
      <Box>
        {!hasUnpartitionedState && (
          <Button variant="link" isFullWidth style={{ marginTop: "-16px" }}>
            Why should I back up my wallet?
          </Button>
        )}
        <br />
        <Copyable
          style={{ margin: "32px 0" }}
          isFullWidth
          label="Your wallet address"
          onClick={() => {
            copy(JSON.stringify(address, null, 2));
          }}
          value={JSON.stringify(address, null, 2)}
        />
        <Button variant="primary" isFullWidth href="/account/backup-shares">
          Backup now
        </Button>
        <Button
          variant="secondary"
          isFullWidth
          href="/account"
          onClick={() => handleSkipClicked()}
        >
          Backup later
        </Button>
        {promptToBackUp && (
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
