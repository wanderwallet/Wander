import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Row,
  SeedInput,
  WanderIcon,
  Text
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

export function AccountImportSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
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
      onBackButtonClick={() => {
        window.history.back();
      }}
      hasCloseButton={false}
      size="auto"
    >
      <SeedInput
        handleSubmit={handleImportWallet}
        seedPhrase={seedPhrase}
        handleCopyToClipboard={() =>
          navigator.clipboard.writeText(seedPhrase.join(" "))
        }
        handleInputChange={(index: number, value: string) => {
          setSeedPhrase((prevSeedPhrase) => {
            const newSeedPhrase = [...prevSeedPhrase];
            newSeedPhrase[index] = value;
            return newSeedPhrase;
          });
        }}
      />
      <Button isFullWidth size="md">
        Recover
      </Button>
    </Card>
  );
}
