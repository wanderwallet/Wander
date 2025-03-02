import { useRef } from "react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";

import screenSrc from "url:/assets-beta/figma-screens/backup-shares.view.png";

export function AccountBackupSharesReminderEmbeddedView() {
  const { currentWallet, skipBackUp } = useEmbedded();
  const isMandatoryReminder =
    currentWallet.totalBackups === 0 && !currentWallet.doNotAskAgainSetting;

  const checkboxRef = useRef<HTMLInputElement>();

  const handleSkipClicked = () => {
    return skipBackUp(checkboxRef?.current.checked);
  };

  return (
    <DevFigmaScreen
      title="Account backup"
      src={screenSrc}
      config={[
        {
          label: "Back up now",
          to: "/account/backup-shares"
        },
        isMandatoryReminder
          ? {
              label: "Back up later",
              to: "/account",
              onClick: () => handleSkipClicked(),
              variant: "secondary"
            }
          : {
              label: "Cancel",
              to: "/account",
              variant: "secondary"
            }
      ]}
    >
      {isMandatoryReminder ? (
        <label>
          <input type="checkbox" ref={checkboxRef} />
          Do not ask again
        </label>
      ) : null}
    </DevFigmaScreen>
  );
}
