import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { useState, useCallback } from "react";
import {
  Card,
  Copyable,
  Button,
  KeyIcon,
  GoogleIcon,
  SocialsIcon,
  Checkbox,
  WanderFooter
} from "~components/embed/ui";
import copy from "copy-to-clipboard";
import type { AuthProviderType } from "embed-api";
import { toast } from "react-toastify";
export function AuthRecoverAccountAuthenticationEmbeddedView() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { back } = useLocation();
  const { importedTempWalletAddress, recoverableAccounts, recoverAccount } =
    useEmbedded();

  const accountToRecover = recoverableAccounts?.[0];
  const accountToRecoverId = accountToRecover?.userId;

  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(false);

  const toggleCheckboxChecked = () =>
    setCheckboxChecked((prevValue) => !prevValue);

  const handleRecoverAccount = useCallback(
    async (authProviderType: AuthProviderType) => {
      try {
        setIsLoading(true);
        await recoverAccount(authProviderType, accountToRecoverId);
      } catch (error) {
        toast.error(error);
      } finally {
        setIsLoading(false);
      }
    },
    [recoverAccount, accountToRecoverId]
  );

  return (
    <Card
      headerText={"Recover your account"}
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      onCloseButtonClick={() => {
        window.history.back();
      }}
      size="auto"
    >
      <Copyable
        style={{ margin: "32px 0" }}
        isFullWidth
        label="Your wallet address"
        onClick={() => {
          copy(importedTempWalletAddress);
        }}
        value={importedTempWalletAddress}
      />
      <Button
        onClick={() => handleRecoverAccount("PASSKEYS")}
        variant="outlined"
        isFullWidth
        isDisabled={!checkboxChecked || isLoading}
        icon={<KeyIcon fontSize={24} />}
      >
        Passkey
      </Button>
      <Button
        onClick={() => handleRecoverAccount("GOOGLE")}
        variant="outlined"
        isFullWidth
        isDisabled={!checkboxChecked || isLoading}
        icon={<GoogleIcon fontSize={24} />}
      >
        Google
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        isDisabled
        // isDisabled={!checkboxChecked || isLoading}
        icon={<SocialsIcon fontSize={24} />}
        href="#/auth/recover-account/more-authentication"
      >
        More options
      </Button>
      <Checkbox
        label="After recovery, all your devices are logged out and your account recovery files are invalided. You'll have to download a new one."
        isChecked={checkboxChecked}
        handleChange={toggleCheckboxChecked}
      />
    </Card>
  );
}
