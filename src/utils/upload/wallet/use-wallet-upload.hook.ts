import { useCallback, useState } from "react";
import type { RecoveryJSON, TempWallet, Wallet } from "~utils/embedded/embedded.types";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { WalletUtils } from "~utils/wallets/wallets.utils";

interface UploadState {
  isLoading?: boolean;
  error?: string;
  data?: unknown;
  importedWalletAddress?: string;
}

const INITIAL_UPLOAD_STATE: UploadState = {};

export interface UseWalletUploadProps {
  wallets: Wallet[];
  importTempWallet: (jwkOrSeedPhrase: JWKInterface | string) => Promise<TempWallet>;
  allowRecoveryFile: boolean;
  mustWalletExist: boolean;
}

export interface UseWalletUploadReturn extends UploadState {
  parse: (data: unknown) => Promise<void>;
  reset: () => void;
}

export function useWalletUpload({
  wallets,
  importTempWallet,
  allowRecoveryFile,
  mustWalletExist,
}: UseWalletUploadProps): UseWalletUploadReturn {
  const [uploadState, setUploadState] = useState<UploadState>(INITIAL_UPLOAD_STATE);

  const parse = useCallback(
    async (data: unknown) => {
      try {
        if (!data) {
          throw new Error("A file is required.");
        }

        if (WalletUtils.isRecoveryJSON(data)) {
          if (!allowRecoveryFile) {
            throw new Error("You uploaded a recovery file, not a keyfile.");
          }

          const wallet = wallets.find(({ id }) => data.walletId === id);

          if (!wallet && mustWalletExist) {
            throw new Error("This wallet is not part of your account.");
          } else if (wallet && !mustWalletExist) {
            throw new Error("This wallet was already added to your account.");
          }

          setUploadState({
            data,
            importedWalletAddress: wallet?.address,
          });

          return;
        }

        if (!WalletUtils.isJWK(data)) {
          throw new Error("Invalid file.");
        }

        setUploadState({
          isLoading: true,
        });

        const tempWallet = await importTempWallet(data);

        if (!tempWallet) {
          throw new Error("Error while importing wallet.");
        }

        const wallet = wallets.find(({ address }) => tempWallet.walletAddress === address);

        if (!wallet && mustWalletExist) {
          throw new Error("This wallet is not part of your account.");
        } else if (wallet && !mustWalletExist) {
          throw new Error("This wallet was already added to your account.");
        }

        setUploadState({
          data,
          importedWalletAddress: wallet?.address || tempWallet.walletAddress,
        });
      } catch (error) {
        const errorMessage = (error as Error)?.message || "Unexpected error while processing upload.";

        setUploadState({
          error: errorMessage,
        });
      }
    },
    [wallets, importTempWallet, allowRecoveryFile],
  );

  const reset = useCallback(() => {
    setUploadState(INITIAL_UPLOAD_STATE);
  }, []);

  return {
    ...uploadState,
    parse,
    reset,
  };
}
