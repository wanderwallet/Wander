import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useRef, useState } from "react";

import { Card, Row, Upload, WanderIcon, Text } from "~components/embed/ui";

export function AuthRestoreSharesRecoveryFileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const { wallets, restoreWallet } = useEmbedded();
  const walletAddress = wallets[0].address;

  const textInputRef = useRef<HTMLInputElement>(null);

  const handleRestore = () => {
    setLoading(true);
    const textareaElement = textInputRef.current;

    // TODO: Throw error with error message for `DevFigmaScreen` to display it:
    if (!textareaElement) return;
    setLoading(false);
    return restoreWallet(walletAddress, JSON.parse(textInputRef.current.value));
  };

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

  return (
    <Card
      headerText="Restore shares / wallet"
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
      hasCloseButton={true}
      onCloseButtonClick={() => {
        window.location.href = "/auth/restore-shares";
      }}
      size="auto"
    >
      <Upload
        textInputRef={textInputRef}
        isFullWidth
        title={"Upload recovery file"}
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Recovering account..."}
        onFileChange={handleRestore}
      />
    </Card>
  );
}
