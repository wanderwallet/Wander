import { useRef, useState } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Row,
  WanderIcon,
  Text
} from "~components/embed/ui";

export function AccountBackupSharesReminderEmbeddedView() {
  const { promptToBackUp, skipBackUp } = useEmbedded();
  const [isChecked, setIsChecked] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>();

  const handleSkipClicked = () => {
    return skipBackUp(isChecked);
  };

  return (
    <Card
      headerText="Account backup"
      subtitle="Secure your account by backing it up."
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={true}
      size="auto"
    >
      <Box>
        <Button variant="primary" isFullWidth href="/account/backup-shares">
          Backup now
        </Button>
        {promptToBackUp ? (
          <Button
            variant="secondary"
            isFullWidth
            href="/account"
            onClick={() => handleSkipClicked()}
          >
            Backup later
          </Button>
        ) : (
          <Button variant="secondary" isFullWidth href="/account">
            Cancel
          </Button>
        )}
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
