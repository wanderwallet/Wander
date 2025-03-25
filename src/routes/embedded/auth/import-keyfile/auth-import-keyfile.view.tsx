import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useRef, useState } from "react";
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
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";

export function AuthImportKeyfileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const { back } = useLocation();
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
        const tempWallet = await importTempWallet(jsonData);

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
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto"
    >
      <Copyable
        isFullWidth
        label="Your wallet address"
        onClick={() => {
          copy(importedTempWalletAddress);
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
          onClick={() => registerWallet("IMPORTED")}
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
      onBackButtonClick={back}
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
