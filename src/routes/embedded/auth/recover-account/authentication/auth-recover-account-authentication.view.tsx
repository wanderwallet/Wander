import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";
import { useState } from "react";

import screenSrc from "url:/assets-beta/figma-screens/recover-account-authentication.view.png";

export function AuthRecoverAccountAuthenticationEmbeddedView() {
  const { importedTempWalletAddress, recoverableAccounts, recoverAccount } =
    useEmbedded();

  const accountToRecover = recoverableAccounts?.[0];
  const accountToRecoverId = accountToRecover?.userId;

  const { back } = useLocation();

  const [checkboxChecked, setCheckboxChecked] = useState<boolean>(false);

  const toggleCheckboxChecked = () =>
    setCheckboxChecked((prevValue) => !prevValue);

  return (
    <DevFigmaScreen
      title="Recover your account"
      description="Sign Up or Sign In"
      src={screenSrc}
      isLoading={!accountToRecover}
      config={[
        {
          label: importedTempWalletAddress,
          isDisabled: true
        },
        {
          label: accountToRecover ? accountToRecover.name : "-",
          isDisabled: true
        },
        {
          label: "Passkey",
          onClick: () => recoverAccount("PASSKEYS", accountToRecoverId),
          isDisabled: !checkboxChecked
        },
        {
          label: "Google",
          onClick: () => recoverAccount("GOOGLE", accountToRecoverId),
          isDisabled: !checkboxChecked
        },
        {
          label: "More Options",
          to: "/auth/recover-account/more-authentication",
          variant: "secondary"
        },
        {
          label: "Back",
          onClick: back,
          variant: "secondary"
        }
      ]}
    >
      <div>
        <label>
          <input
            type="checkbox"
            checked={checkboxChecked}
            onChange={toggleCheckboxChecked}
          />
          After recovery, all your devices are logged out and your account
          recovery files are invalided. You'll have to download a new one.
        </label>
      </div>
    </DevFigmaScreen>
  );
}
