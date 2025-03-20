import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useState } from "react";

import {
  AppleIcon,
  Box,
  Button,
  Card,
  FacebookIcon,
  TwitterIcon,
  Checkbox,
  WanderFooter
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRecoverAccountMoreAuthenticationEmbeddedView() {
  const { navigate, back } = useLocation();
  const { importedTempWalletAddress, recoverableAccounts, recoverAccount } =
    useEmbedded();

  const accountToRecover = recoverableAccounts?.[0];
  const accountToRecoverId = accountToRecover?.userId;

  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(false);

  const toggleCheckboxChecked = () =>
    setCheckboxChecked((prevValue) => !prevValue);

  return (
    <Card
      headerText="Recover your account"
      subtitle="More options"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() =>
        navigate(`/auth/recover-account/authentication`)
      }
      size="auto"
    >
      <Box>
        {/* <Button
          variant="outlined"
          isFullWidth
          icon={<EmailIcon fontSize={24} />}
          onClick={() => recoverAccount("EMAIL_N_PASSWORD", accountToRecoverId)}
          isDisabled={!checkboxChecked}
        >
          Email & Password
        </Button> */}
        <Button
          variant="outlined"
          isFullWidth
          icon={<FacebookIcon fontSize={24} />}
          onClick={() => recoverAccount("FACEBOOK", accountToRecoverId)}
          isDisabled={!checkboxChecked}
        >
          Facebook
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          isDisabled={!checkboxChecked}
          onClick={() => recoverAccount("APPLE", accountToRecoverId)}
        >
          Apple
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<TwitterIcon fontSize={24} />}
          isDisabled={!checkboxChecked}
          onClick={() => recoverAccount("X", accountToRecoverId)}
        >
          X
        </Button>
        <Checkbox
          label="After recovery, all your devices are logged out and your account recovery files are invalided. You'll have to download a new one."
          handleChange={toggleCheckboxChecked}
          isChecked={checkboxChecked}
        />
      </Box>
    </Card>
  );
}
