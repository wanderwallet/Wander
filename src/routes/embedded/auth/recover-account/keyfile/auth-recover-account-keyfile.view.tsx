import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useState } from "react";
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
import { WalletUtils } from "~utils/wallets/wallets.utils";

export function AuthRecoverAccountKeyfileEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [fileError, setFileError] = useState(false);
  const { navigate, back } = useLocation();

  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts,
    setAccountToRecover
  } = useEmbedded();

  const handleJsonParse = async (jsonData: any) => {
    try {
      setLoading(true);
      if (jsonData) {
        setFileError(false);
        if (!WalletUtils.isJWK(jsonData)) {
          setFileError(true);
          setLoading(false);
          return;
        }
        const tempWallet = await importTempWallet(jsonData);

        if (!tempWallet) {
          setLoading(false);
          return toast.error(`Something isn't right`);
        }
        setLoading(false);
        return tempWallet;
      } else {
        setFileError(true);
      }
    } catch (error) {
      toast.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async () => {
    try {
      setLoading(true);
      const recoverableAccounts = await fetchRecoverableAccounts();
      if (recoverableAccounts.length === 1) {
        setAccountToRecover(recoverableAccounts[0]);
        navigate("/auth/recover-account/authentication");
      } else if (recoverableAccounts.length > 1) {
        toast.error("Multiple recoverable accounts found");
        navigate("/auth/recover-account/select");
      } else {
        toast.error("No recoverable accounts found");
      }
      setLoading(false);
    } catch (error) {
      toast.error(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    deleteImportedTempWallet();
    clearRecoverableAccounts();
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
      {fileError && (
        <Text
          alignment="left"
          variant="bodySm"
          style={{ color: "#D22B1F", alignSelf: "flex-start", marginTop: -20 }}
        >
          Error: incorrect file format
        </Text>
      )}
    </Card>
  );
}
