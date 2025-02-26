import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEffect, useRef } from "react";
import type { JWKInterface } from "arweave/web/lib/wallet";

import screenSrc from "url:/assets-beta/figma-screens/import-keyfile.view.png";
import confirmScreenSrc from "url:/assets-beta/figma-screens/import-keyfile-confirmation.view.png";
import { WalletSourceType } from "embed-api";

export function AuthImportKeyfileEmbeddedView() {
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

    const jwk = JSON.parse(textareaElement.value) as JWKInterface;

    return importTempWallet(jwk);
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
      title="Import private key"
      src={confirmScreenSrc}
      config={[
        {
          label: importedTempWalletAddress,
          isDisabled: true
        },
        {
          label: "No, upload again",
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
      title="Import private key"
      src={screenSrc}
      config={[
        {
          label: "Upload",
          onClick: handleImportWallet
        },
        {
          label: "Back",
          to: "/auth/add-wallet",
          variant: "secondary"
        }
      ]}
    >
      <textarea ref={textareaRef} placeholder="Upload keyfile"></textarea>
    </DevFigmaScreen>
  );
}
