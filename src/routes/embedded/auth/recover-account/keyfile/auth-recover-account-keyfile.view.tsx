import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";

import {
  Card,
  Row,
  Button,
  Copyable,
  Upload,
  Text,
  WanderFooter
} from "~components/embed";
import copy from "copy-to-clipboard";
import { toast } from "react-toastify";

export function AuthRecoverAccountKeyfileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [jsonData, setJsonData] = useState<any>(null);
  const { navigate, back } = useLocation();

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
  };

  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    wallets,
    recoverWallet,
    registerWallet
  } = useEmbedded();

  const handleImportWallet = useCallback(async () => {
    try {
      setLoading(true);
      if (jsonData) {
        const tempWallet = await importTempWallet(jsonData);

        if (!tempWallet) {
          setLoading(false);
          return toast.error(`Something isn't right`);
        }
        setLoading(false);
        return tempWallet;
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  }, [jsonData]);

  const handleRecover = useCallback(async () => {
    try {
      setLoading(true);
      const isWalletPresent = wallets.some(
        ({ address }) => address === importedTempWalletAddress
      );
      if (isWalletPresent) {
        await recoverWallet(jsonData);
      } else {
        toast.error("Wallet not found!");
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [registerWallet, jsonData, wallets, importedTempWalletAddress]);

  useEffect(() => {
    deleteImportedTempWallet();
  }, []);

  return importedTempWalletAddress ? (
    <Card
      headerText="Import Keyfile"
      subtitle="Upload your private key to recover your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate(`/auth`)}
      style={{ gap: 24 }}
      size="auto"
    >
      <Text>Would you like to recover this account?</Text>
      <Copyable
        isFullWidth
        style={{ padding: 0 }}
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
          onClick={() => handleRecover()}
          isLoading={loading}
        >
          Yes, recover
        </Button>
      </Row>
    </Card>
  ) : (
    <Card
      headerText="Import Keyfile"
      subtitle="Upload your private key to recover your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto"
      style={{ gap: 24 }}
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
        isDisabled={!jsonData || loading}
        onClick={handleImportWallet}
      >
        Import
      </Button>
    </Card>
  );
}
