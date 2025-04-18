import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Card,
  Row,
  Upload,
  Copyable,
  Button,
  WanderFooter
} from "~components/embed";
import copy from "copy-to-clipboard";
import { useLocation } from "~wallets/router/router.utils";
import { toast } from "react-toastify";
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
    registerWallet,
    wallets,
    recoverWallet
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

  const handleAddWallet = useCallback(async () => {
    try {
      setLoading(true);
      const isWalletPresent = wallets.some(
        ({ address }) => address === importedTempWalletAddress
      );
      if (isWalletPresent) {
        await recoverWallet(jsonData);
      } else {
        if (wallets.length === 0) {
          await registerWallet("IMPORTED");
        } else {
          toast.error("Wallet not found!");
        }
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [registerWallet, jsonData, wallets, importedTempWalletAddress]);

  useEffect(() => {
    return () => {
      // Remove the imported keyfile from memory as soon as we leave this view. Note at this point it will already have
      // been passed to `importTempWallet()`, if the user confirmed:
      deleteImportedTempWallet();
    };
  }, []);

  return importedTempWalletAddress ? (
    <Card
      headerText="Enter Keyfile"
      subtitle="Would you like to add this wallet to your account?"
      footerElement={<WanderFooter />}
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
          onClick={handleAddWallet}
          isLoading={loading}
        >
          Yes, add
        </Button>
      </Row>
    </Card>
  ) : (
    <Card
      headerText="Import private key"
      subtitle="Upload your private key to connect your wallet to your account."
      footerElement={<WanderFooter />}
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
        isDisabled={!jsonData || loading}
        onClick={handleImportWallet}
      >
        Import
      </Button>
    </Card>
  );
}
