import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef } from "react";

import {
  Row,
  WanderIcon,
  Card,
  Button,
  Text,
  SeedInput
} from "~components/embed";

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

  return (
    <Card
      headerText="Enter Seedphrase"
      subtitle="Enter your seedphrase to connect your wallet to your account."
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
      <SeedInput
        handleSubmit={handleImportWallet}
        handleCopyToClipboard={function (): void {
          throw new Error("Function not implemented.");
        }}
        handleInputChange={function (index: number, value: string): void {
          throw new Error("Function not implemented.");
        }}
      />
      <Button isFullWidth size="md">
        Recover
      </Button>
    </Card>
  );
}
