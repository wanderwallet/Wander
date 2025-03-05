import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { useState } from "react";
import {
  Card,
  Row,
  WanderIcon,
  Text,
  Copyable,
  Button,
  KeyIcon,
  GoogleIcon,
  SocialsIcon,
  Checkbox
} from "~components/embed/ui";

export function AuthRecoverAccountAuthenticationEmbeddedView() {
  const { importedTempWalletAddress, recoverableAccounts, recoverAccount } =
    useEmbedded();

  const accountToRecover = recoverableAccounts?.[0];
  const accountToRecoverId = accountToRecover?.id;

  const { back } = useLocation();

  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(false);

  const toggleCheckboxChecked = () =>
    setCheckboxChecked((prevValue) => !prevValue);

  return (
    <Card
      headerText={"Recover your account"}
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
      //   hasCloseButton={false}
      onCloseButtonClick={() => {
        window.history.back();
      }}
      size="auto"
    >
      <Copyable
        style={{ margin: "32px 0" }}
        isFullWidth
        label="Your account address"
        onClick={() => {
          navigator.clipboard.writeText(importedTempWalletAddress);
        }}
        value={importedTempWalletAddress}
      />
      <Button
        onClick={() => recoverAccount("passkey", accountToRecoverId)}
        variant="outlined"
        isFullWidth
        isDisabled={!checkboxChecked}
        icon={<KeyIcon fontSize={24} />}
      >
        Passkey
      </Button>
      <Button
        onClick={() => recoverAccount("google", accountToRecoverId)}
        variant="outlined"
        isFullWidth
        isDisabled={!checkboxChecked}
        icon={<GoogleIcon fontSize={24} />}
      >
        Google
      </Button>
      <Button
        variant="outlined"
        isFullWidth
        icon={<SocialsIcon fontSize={24} />}
        href="/auth/recover-account/more-authentication"
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
  //         label: accountToRecover ? accountToRecover.name : "-",
  //         isDisabled: true
}
