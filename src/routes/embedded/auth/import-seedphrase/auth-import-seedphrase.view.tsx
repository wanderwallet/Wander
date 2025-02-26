import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEffect, useRef } from "react";

import screenSrc from "url:/assets-beta/figma-screens/import-seedphrase.view.png";
import confirmScreenSrc from "url:/assets-beta/figma-screens/import-seedphrase-confirmation.view.png";
import { WalletSourceType } from "embed-api";

export function AuthImportSeedphraseEmbeddedView() {
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet
  } = useEmbedded();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImportWallet = () => {
    const textareaElement = textareaRef.current;

    // TODO: Throw error with error message for `DevFigmaScreen` to display it:
    if (!textareaElement) return;

    return importTempWallet(textareaRef.current.value);
  };

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedTempWalletAddress ? (
    <DevFigmaScreen
      title="Enter seedphrase"
      src={confirmScreenSrc}
      config={[
        {
          label: importedTempWalletAddress,
          isDisabled: true
        },
        {
          label: "No, try again",
          onClick: () => deleteImportedTempWallet(),
          variant: "secondary"
        },
        {
          label: "Yes, add",
          onClick: () => registerWallet(WalletSourceType.IMPORTED)
        }
      ]}
    />
  ) : (
    <DevFigmaScreen
      title="Enter seedphrase"
      src={screenSrc}
      config={[
        {
          label: "Import",
          onClick: handleImportWallet
        },
        {
          label: "Back",
          to: "/auth/add-wallet",
          variant: "secondary"
        }
      ]}
    >
      <textarea ref={textareaRef} placeholder="Enter seedphrase"></textarea>
    </DevFigmaScreen>
  );
}
