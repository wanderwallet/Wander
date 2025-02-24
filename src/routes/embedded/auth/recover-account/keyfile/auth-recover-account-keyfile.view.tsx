import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef, useState } from "react";
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
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts
  } = useEmbedded();

  const textInputRef = useRef<HTMLInputElement>(null);

  const handleImportWallet = () => {
    const textareaElement = textInputRef.current;

    // TODO: Throw error with error message for `DevFigmaScreen` to display it:
    if (!textareaElement) return;

    return importTempWallet(textInputRef.current.value);
  };

  const { navigate } = useLocation();

  const handleRecover = async () => {
    setLoading(true);
    await fetchRecoverableAccounts();

    setLoading(false);
    navigate("/auth/recover-account/authentication");
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
        <Button variant="primary" size="md" onClick={handleRecover}>
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
      hasCloseButton={false}
      size="auto"
    >
      <Upload
        textInputRef={textInputRef}
        isFullWidth
        title={"Click to upload"}
        description={"or drag and drop your private key"}
        isLoading={loading}
        loadingText={"Recovering account..."}
        onFileChange={handleImportWallet}
      />
    </Card>
  );

  //   <DevFigmaScreen
  //     title="Recover your account"
  //     description="Import private key"
  //     src={screenSrc}
  //     config={[
  //       {
  //         label: "Recover",
  //         onClick: handleImportWallet
  //       },
  //       {
  //         label: "Back",
  //         to: "/auth/recover-account",
  //         variant: "secondary"
  //       }
  //     ]}
  //   >
  //     <textarea ref={textareaRef} placeholder="Upload keyfile"></textarea>
  //   </DevFigmaScreen>
  // );
}
