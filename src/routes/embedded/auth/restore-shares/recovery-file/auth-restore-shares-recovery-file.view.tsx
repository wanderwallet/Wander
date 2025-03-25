import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useRef, useState } from "react";

import {
  Card,
  Row,
  Upload,
  WanderIcon,
  Text,
  Button
} from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";

export function AuthRestoreSharesRecoveryFileEmbeddedView() {
  const { navigate, back } = useLocation();
  const [loading, setLoading] = useState(false);
  const { currentWallet, recoverWallet } = useEmbedded();
  const walletAddress = currentWallet.address;
  const [jsonData, setJsonData] = useState<any>(null);

  const handleJsonParse = (parsedData: any) => {
    setJsonData(parsedData);
  };

  const handleRestore = useCallback(async () => {
    try {
      setLoading(true);
      if (jsonData) {
        const restoredWallet = recoverWallet(jsonData);

        if (!restoredWallet) {
          setLoading(false);
          return alert(`Something isn't right`);
        }
        setLoading(false);
        return restoredWallet;
      }
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  }, [jsonData]);

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

  return (
    <Card
      headerText="Restore shares / wallet"
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
      hasCloseButton={true}
      onCloseButtonClick={() => navigate("/auth/restore-shares")}
      size="auto"
    >
      <Upload
        isFullWidth
        title={"Upload recovery file"}
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Restoring account..."}
        onFileParse={handleJsonParse}
      />
      <Button isFullWidth size="md" isLoading={loading} onClick={handleRestore}>
        Restore
      </Button>
    </Card>
  );
}
