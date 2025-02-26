import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useRef } from "react";

import screenSrc from "url:/assets-beta/figma-screens/restore-shares.view.png";

export function AuthRestoreSharesRecoveryFileEmbeddedView() {
  const { currentWallet, recoverWallet } = useEmbedded();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleRestore = () => {
    const textareaElement = textareaRef.current;

    // TODO: Throw error with error message for `DevFigmaScreen` to display it:
    if (!textareaElement) return;

    return recoverWallet(JSON.parse(textareaRef.current.value));
  };

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

  return (
    <DevFigmaScreen
      title="Restore shares / wallet"
      src={screenSrc}
      config={[
        {
          // TODO: Does the recovery file leak the wallet address? If so, this needs to be populated once the recovery
          // file is provided; otherwise, it should be removed it.
          label: currentWallet.address,
          isDisabled: true
        },
        {
          label: "Upload",
          onClick: handleRestore
        },
        {
          label: "Back",
          to: "/auth/restore-shares",
          variant: "secondary"
        }
      ]}
    >
      <textarea ref={textareaRef} placeholder="Upload recovery file"></textarea>
    </DevFigmaScreen>
  );
}
