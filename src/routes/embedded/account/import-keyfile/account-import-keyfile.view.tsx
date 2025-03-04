import type { JWKInterface } from "arweave/web/lib/wallet";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Copyable,
  Row,
  Upload,
  WanderIcon,
  Text
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

export function AccountImportKeyfileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
  };

  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    registerWallet
  } = useEmbedded();

  const handleImportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (jsonData) {
        const tempWallet = await importTempWallet(
          JSON.stringify(jsonData, null, 2)
        );

        if (!tempWallet) {
          setLoading(false);
          return alert(`Something isn't right`);
        }
        setLoading(false);
        return tempWallet;
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [jsonData]);

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
          <WanderIcon color="#838383" style={{ alignSelf: "end" }} />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={() => {
        window.history.back();
      }}
      //   hasCloseButton={false}
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
      //   hasCloseButton={false}
      size="auto"
    >
      <Upload
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Recovering account..."}
        onFileParse={handleJsonParse}
      />
      <Button
        isFullWidth
        size="md"
        isLoading={loading}
        onClick={handleImportWallet}
      >
        Import
      </Button>
    </Card>
  );
}
