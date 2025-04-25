import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useState } from "react";

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
import { toast } from "react-toastify";
import type { AuthProviderType } from "embed-api";
export function AuthRecoverAccountMoreAuthenticationEmbeddedView() {
  const { navigate, back } = useLocation();
  const { recoverableAccounts, recoverAccount } = useEmbedded();

  const accountToRecover = recoverableAccounts?.[0];
  const accountToRecoverId = accountToRecover?.userId;

  const handleRecoverAccount = useCallback(
    async (authProviderType: AuthProviderType) => {
      try {
        await recoverAccount(authProviderType, accountToRecoverId);
      } catch (error) {
        toast.error(error);
      }
    },
    [recoverAccount, accountToRecoverId]
  );

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
        <Button
          variant="outlined"
          isFullWidth
          icon={<FacebookIcon fontSize={24} />}
          onClick={() => handleRecoverAccount("FACEBOOK")}
          isDisabled={!checkboxChecked}
        >
          Facebook
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<AppleIcon fontSize={24} />}
          isDisabled={!checkboxChecked}
          onClick={() => handleRecoverAccount("APPLE")}
        >
          Apple
        </Button>
        <Button
          variant="outlined"
          isFullWidth
          icon={<TwitterIcon fontSize={24} />}
          isDisabled={!checkboxChecked}
          onClick={() => handleRecoverAccount("X")}
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
