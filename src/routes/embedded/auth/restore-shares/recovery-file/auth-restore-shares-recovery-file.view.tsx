import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { Card, Upload, Button, WanderFooter } from "~components/embed/ui";
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
    if (!jsonData) return;
    try {
      setLoading(true);
      await recoverWallet(jsonData);
    } catch (error) {
      toast.error(error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [jsonData, recoverWallet]);

  // TODO: The recovery file should probably include the wallet address or a hash so that we can
  // request the recovery of the right one from the backend without asking the user to manually select
  // the address of the wallet they want to recover.

  // TODO: This view should probably work if the user uploads a keyfile too as many might be confused about the two.

  return (
    <Card
      headerText="Import Recovery file"
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      hasCloseButton={true}
      onCloseButtonClick={() => navigate("/auth/restore-shares")}
      size="auto"
    >
      <Upload
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your recovery file"}
        onFileParse={handleJsonParse}
      />
      <Button
        isFullWidth
        size="md"
        isLoading={loading}
        isDisabled={!jsonData}
        onClick={handleRestore}
      >
        Restore
      </Button>
    </Card>
  );
}
