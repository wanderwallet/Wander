import type { JWKInterface } from "@dha-team/arbundles";
import { useState, useCallback, useEffect } from "react";
import { toast } from "react-toastify";
import { Flex } from "~components/common/Flex";
import { CopyToClipboard } from "~components/CopyToClipboard";
import { Text } from "~components/embed/ui";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";
import type { LocalWallet } from "~wallets/wallets.types";
import browser from "webextension-polyfill";
import { dataToFrames } from "qrloop";
import { freeDecryptedWallet } from "~wallets/encryption";
import { QRCodeWrapper } from "~components/QRCodeWrapper";
import { QRCodeLoop } from "~components/QRCodeLoop";

export function AccountBackupWalletQrCodeEmbeddedView() {
  const { navigate } = useLocation();
  const { getDecryptedWallet } = useEmbedded();
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [decryptedWallet, setDecryptedWallet] = useState<LocalWallet<JWKInterface> | null>(null);

  const fetchDecryptedWallet = useCallback(async () => {
    try {
      setIsLoading(true);
      const decryptedWallet = await getDecryptedWallet();
      setDecryptedWallet(decryptedWallet);
    } catch (error) {
      console.log(error);
      toast.error("Error getting keyfile");
    } finally {
      setIsLoading(false);
    }
  }, [getDecryptedWallet]);

  useEffect(() => {
    fetchDecryptedWallet();
  }, [fetchDecryptedWallet]);

  useEffect(() => {
    if (decryptedWallet?.keyfile) {
      setFrames(dataToFrames(JSON.stringify(decryptedWallet.keyfile)));
      freeDecryptedWallet(decryptedWallet.keyfile);
    }
  }, [decryptedWallet]);

  useEffect(() => {
    return () => setFrames([]);
  }, []);

  return (
    <OnboardingCard
      headerText={!decryptedWallet ? "Generate QR code" : decryptedWallet?.nickname}
      onBackButtonClick={() => navigate("/account/backup-wallet")}
      isLoading={isLoading}>
      <Flex direction="column" gap={32} justify="center" align="center">
        <QRCodeWrapper size={297}>
          <div
            style={{
              backgroundColor: "#fff",
              padding: "12px",
              borderRadius: "12px",
            }}>
            <QRCodeLoop frames={frames} fps={5} size={275} />
          </div>
        </QRCodeWrapper>
        <Flex
          direction="column"
          justify="center"
          align="center"
          gap={12}
          padding={12}
          style={{ background: "#EBEBF0", borderRadius: 8, width: "100%" }}>
          <Text
            variant="bodyMd"
            alignment="left"
            style={{ color: "#121212", flex: 1, textAlign: "center", wordBreak: "break-all" }}>
            {decryptedWallet?.address}
          </Text>
          <CopyToClipboard
            onCopy={setCopied}
            showToast={false}
            label={browser.i18n.getMessage(copied ? "copied" : "copy")}
            labelAs={({ children }) => <Text variant="bodySm">{children}</Text>}
            text={decryptedWallet?.address}
          />
        </Flex>
      </Flex>
    </OnboardingCard>
  );
}
