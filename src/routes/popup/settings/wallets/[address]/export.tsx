import {
  Button,
  Input,
  Section,
  Text,
  useInput,
  useToasts
} from "@arconnect/components-rebrand";
import { type StoredWallet } from "~wallets";
import { useMemo, useState } from "react";
import { useStorage } from "~utils/storage";
import { decryptWallet, freeDecryptedWallet } from "~wallets/encryption";
import { ExtensionStorage } from "~utils/storage";
import { downloadKeyfile } from "~utils/file";
import browser from "webextension-polyfill";
import HeadV2 from "~components/popup/HeadV2";
import type { CommonRouteProps } from "~wallets/router/router.types";
import { useLocation } from "~wallets/router/router.utils";
import { LoadingView } from "~components/page/common/loading/loading.view";
import { Wrapper } from "~routes/popup/receive";

export interface ExportWalletViewParams {
  address: string;
}

export type ExportWalletViewProps = CommonRouteProps<ExportWalletViewParams>;

export function ExportWalletView({
  params: { address }
}: ExportWalletViewProps) {
  const { navigate } = useLocation();

  // wallets
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );

  const [loading, setLoading] = useState(false);

  // this wallet
  const wallet = useMemo(
    () => wallets?.find((w) => w.address === address),
    [wallets, address]
  );

  // toasts
  const { setToast } = useToasts();

  // password input
  const passwordInput = useInput();

  // export the wallet
  async function exportWallet() {
    setLoading(true);
    if (wallet.type === "hardware") {
      throw new Error("Hardware wallet cannot be exported");
    }

    try {
      // decrypt keyfile
      const decrypted = await decryptWallet(
        wallet.keyfile,
        passwordInput.state
      );

      // download the file
      downloadKeyfile(address, decrypted);

      // remove wallet from memory
      freeDecryptedWallet(decrypted);
    } catch (e) {
      console.log("Error exporting wallet", e.message);
      setToast({
        type: "error",
        content: browser.i18n.getMessage("export_wallet_error"),
        duration: 2200
      });
    } finally {
      setLoading(false);
    }
  }

  if (!wallet) {
    return <LoadingView />;
  }

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("export_keyfile")}
        showOptions={false}
      />
      <Wrapper style={{ height: "calc(100vh - 100px)" }}>
        <Section
          style={{ justifyContent: "space-between", flex: 1 }}
          showPaddingVertical={false}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Text noMargin>
              {browser.i18n.getMessage("export_keyfile_description")}
            </Text>
            <Input
              sizeVariant="small"
              type="password"
              placeholder={browser.i18n.getMessage("password")}
              {...passwordInput.bindings}
              fullWidth
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                exportWallet();
              }}
            />
          </div>
          <Button fullWidth onClick={exportWallet} loading={loading}>
            {browser.i18n.getMessage("export")}
          </Button>
        </Section>
      </Wrapper>
    </>
  );
}
