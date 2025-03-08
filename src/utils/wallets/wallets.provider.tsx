import {
  createContext,
  useEffect,
  useState,
  type PropsWithChildren
} from "react";
import { ExtensionStorage } from "~utils/storage";
import {
  getActiveAddress,
  getWallets,
  openOrSelectWelcomePage,
  type StoredWallet
} from "~wallets";
import { getDecryptionKey } from "~wallets/auth";

export type WalletStatus = "noWallets" | "loading" | "locked" | "unlocked";

interface WalletsContextState {
  walletStatus: WalletStatus;
  wallets: StoredWallet<string>[];
  activeAddress: string;
  decryptionKey: string;
}

interface WalletsContextData extends WalletsContextState {
  // isAuthenticated: boolean;
  // signIn
  // signOut
}

const WALLETS_CONTEXT_INITIAL_STATE: WalletsContextState = {
  walletStatus: "noWallets",
  wallets: [],
  activeAddress: "",
  decryptionKey: ""
};

export const WalletsContext = createContext<WalletsContextData>({
  ...WALLETS_CONTEXT_INITIAL_STATE
  // isAuthenticated: false,
  // signIn
  // signOut
});

interface AuthRequestProviderProps extends PropsWithChildren {
  redirectToWelcome?: boolean;
}

export function WalletsProvider({
  redirectToWelcome,
  children
}: AuthRequestProviderProps) {
  const [walletsContextState, setWalletsContextState] =
    useState<WalletsContextState>(WALLETS_CONTEXT_INITIAL_STATE);

  useEffect(() => {
    async function checkWalletState() {
      const [activeAddress, wallets, decryptionKey] = await Promise.all([
        getActiveAddress(),
        getWallets(),
        getDecryptionKey()
      ]);

      const hasWallets = activeAddress && wallets.length > 0;

      let walletStatus: WalletStatus = "noWallets";

      if (hasWallets) {
        walletStatus = decryptionKey ? "unlocked" : "locked";
      } else if (redirectToWelcome) {
        // This should only happen when opening the regular popup, but not for the auth popup, as the
        // `createAuthPopup` will open the welcome page directly, instead of the popup, if needed:

        await openOrSelectWelcomePage(true);

        window.top.close();

        return;
      }

      setWalletsContextState({
        walletStatus,
        wallets,
        activeAddress,
        decryptionKey
      });

      const coverElement = document.getElementById("cover");

      if (coverElement) {
        if (walletStatus === "noWallets") {
          coverElement.removeAttribute("aria-hidden");
        } else {
          coverElement.setAttribute("aria-hidden", "true");
        }
      }
    }

    ExtensionStorage.watch({
      decryption_key: checkWalletState
    });

    checkWalletState();

    return () => {
      ExtensionStorage.unwatch({
        decryption_key: checkWalletState
      });
    };
  }, [redirectToWelcome]);

  return (
    <WalletsContext.Provider value={walletsContextState}>
      {children}
    </WalletsContext.Provider>
  );
}
