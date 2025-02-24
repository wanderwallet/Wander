import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef, useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet
  } = useEmbedded();

  const textInputRef = useRef<HTMLInputElement>(null);

  const handleImportWallet = () => {
    const textInputElement = textInputRef.current;

    // TODO: Throw error with error message for `DevFigmaScreen` to display it:
    if (!textInputElement) return;

    const jwk = JSON.parse(textInputElement.value) as JWKInterface;
    setLoading(false);
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
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={false}
      size="auto"
    >
      <Copyable
        isFullWidth
        label="Your account address"
        onClick={() => {
          navigator.clipboard.writeText(importedTempWalletAddress);
        }}
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
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={false}
      size="auto"
    >
      <Upload
        textInputRef={textInputRef}
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Recovering account..."}
        onFileChange={handleImportWallet}
      />
    </Card>
  );
}
