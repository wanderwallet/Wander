import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";

import {
  Card,
  Row,
  Text,
  Button,
  WanderIcon,
  Copyable,
  Upload
} from "~components/embed";

export function AuthRecoverAccountKeyfileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
  };

  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts
  } = useEmbedded();

  const handleImportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (jsonData) {
        const tempWallet = await importTempWallet(
          JSON.parse(JSON.stringify(jsonData, null, 2))
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

  const { navigate } = useLocation();

  const handleRecover = async () => {
    try {
      setLoading(true);
      await fetchRecoverableAccounts();
      setLoading(false);
      navigate("/auth/recover-account/authentication");
    } catch (error) {
      alert(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    deleteImportedTempWallet();
    clearRecoverableAccounts();
  }, []);

  return importedTempWalletAddress ? (
    <Card
      headerText="Recover your account"
      subtitle="Import private key"
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
        window.location.href = "/auth";
      }}
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
          onClick={() => handleRecover()}
          isLoading={loading}
        >
          Yes, recover
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
