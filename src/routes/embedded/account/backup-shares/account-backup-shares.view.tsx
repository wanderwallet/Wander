import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";

import screenSrc from "url:/assets-beta/figma-screens/backup-options.view.png";

export function AccountBackupSharesEmbeddedView() {
  const { currentWallet, generateRecoveryAndDownload } = useEmbedded();

  // TODO: What if the user already has more than 3 backup shares?

  // TODO: Do we download one file for the whole account or a file per wallet?

  // TODO: Show confirmation message once backed up and keep the file in-memory
  // in case the button is clicked again.

  // TODO: Add an option to encrypt with a password

  // TODO: Redirect user to backup confirmation next or show some kind of confirmation or just redirect home?

  return (
    <DevFigmaScreen
      title="Account backup"
      src={screenSrc}
      config={[
        {
          // TODO: This should be a selector / dropdown and we might want to include a bulk / download all option
          label: currentWallet.address,
          isDisabled: true
        },
        {
          label: "Google Drive",
          onClick: () => alert("Not implemented.")
        },
        {
          label: "iCloud",
          onClick: () => alert("Not implemented.")
        },
        {
          label: "Dropbox",
          onClick: () => alert("Not implemented.")
        },
        {
          label: "Download Account Recovery File",
          onClick: () => generateRecoveryAndDownload()
        },
        currentWallet.totalBackups === 0
          ? {
              label: "Back",
              to: "/account/backup-shares/reminder",
              variant: "secondary"
            }
          : {
              label: "Cancel",
              to: "/account",
              variant: "secondary"
            }
      ]}
    />
  );
}
