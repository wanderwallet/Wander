import { DevFigmaScreen } from "~components/dev/figma-screen/figma-screen.component";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "~wallets/router/router.utils";

import screenSrc from "url:/assets-beta/figma-screens/recover-account-seedphrase.view.png";
import confirmScreenSrc from "url:/assets-beta/figma-screens/recover-account-seedphrase-confirmation.view.png";
import {
  Card,
  Copyable,
  Row,
  WanderIcon,
  Text,
  Button,
  SeedInput
} from "~components/embed/ui";

export function AuthRecoverAccountSeedphraseEmbeddedView() {
  const [loading, setLoading] = useState(false);
  const [seedPhrase, setSeedPhrase] = useState<string[]>([]);
  const {
    importTempWallet,
    importedTempWalletAddress,
    deleteImportedTempWallet,
    fetchRecoverableAccounts,
    clearRecoverableAccounts
  } = useEmbedded();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleImportWallet = () => {
    const textareaElement = textareaRef.current;

    // TODO: Throw error with error message for `DevFigmaScreen` to display it:
    if (!textareaElement) return;

    return importTempWallet(textareaRef.current.value);
  };

  const { navigate } = useLocation();

  const handleRecover = async () => {
    try {
      setLoading(true);
      await fetchRecoverableAccounts();
      setLoading(false);
      navigate("/auth/recover-account/authentication");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    deleteImportedTempWallet();
    clearRecoverableAccounts();
  }, []);

  return importedTempWalletAddress ? (
    <Card
      headerText="Recover your account"
      subtitle="Enter seedphrase"
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
        window.location.href = "/auth/recover-account";
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
          onClick={() => handleRecover}
          isLoading={loading}
        >
          Yes, recover
        </Button>
      </Row>
    </Card>
  ) : (
    <Card
      headerText="Recover your account"
      subtitle="Enter seedphrase"
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
        seedPhrase={seedPhrase}
        handleSubmit={handleImportWallet}
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
