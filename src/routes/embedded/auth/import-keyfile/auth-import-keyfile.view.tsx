import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef } from "react";
import type { JWKInterface } from "arweave/web/lib/wallet";

import {
  Card,
  Row,
  Upload,
  WanderIcon,
  Text,
  Copyable,
  Button
} from "~components/embed";

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
    <Card
      headerText="Enter Seedphrase"
      subtitle="Would you like to add this wallet to your account?"
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      hasCloseButton={false}
      hasShadow={true}
      size="auto"
    >
      <Copyable
        isFullWidth
        label="Your account address"
        value={importedTempWalletAddress}
      />
      <Row>
        <Button
          variant="secondary"
          size="md"
          onClick={deleteImportedTempWallet}
        >
          No, try again
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={() => registerWallet("imported")}
        >
          Yes, add
        </Button>
      </Row>
    </Card>
  ) : (
    <Card
      headerText="Import private key"
      subtitle="Upload your private key to connect your wallet to your account."
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      hasCloseButton={false}
      hasShadow={true}
      size="auto"
    >
      <Upload
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your private key"}
        loadingText={"Recovering account..."}
      />
    </Card>
  );
}
