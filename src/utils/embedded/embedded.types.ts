import type { PropsWithChildren } from "react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import type {
  DbWallet,
  AuthProviderType,
  SupabaseUser,
  RecoverableAccount,
  WalletSourceType,
  DbSession,
} from "embed-api";

export type AuthStatus =
  | "unknown"
  | "authLoading"
  | "authError"
  | "noAuth"
  | "noWallets"
  | "noShares"
  // TODO: Do not mix auth loading with regular loading...
  | "loading"
  | "locked"
  | "unlocked";

export type EmbeddedSdkAuthStatus = "loading" | "onboarding" | "authenticated" | "not-authenticated";

export type WalletActivationStatus =
  // The wallet is DISABLED, READONLY or LOST.
  | "disabled"
  // The wallet deviceShare is not available and no export/backup was made.
  | "lost"
  // The wallet deviceShare is not available, but the wallet can be recovered.
  | "recoveryNeeded"
  // The wallet deviceShare is available, but its authShare hasn't been loaded.
  | "authNeeded"
  // The wallet private key is not in memory, but its authShare and deviceShare are.
  | "ready"
  // The wallet private key is currently in memory.
  | "active";

export interface Wallet extends DbWallet {
  activationStatus: WalletActivationStatus;

  // Added by the client (from localStorage).
  deviceShare: null | string;

  // Added by the client when activated.
  authShare: null | string;
}

export interface TempWallet {
  seedPhrase: null | string;
  jwk: JWKInterface;
  walletAddress: string;
}

export interface TempWalletPromise {
  createdAt: number;
  promise: Promise<TempWallet>;
  controller: AbortController;
}

export interface EmbeddedProviderProps extends PropsWithChildren {}

export interface EmbeddedContextState {
  currentWalletId: string;
  wallets: Wallet[];
  generatedTempWalletAddress: null | string;
  importedTempWalletAddress: null | string;
  lastRegisteredWallet: null | Wallet;
  recoverableAccounts: null | RecoverableAccount[];
  authEmail: null | string;
  authPassword: null | string;
}

export interface EmbeddedContextAuth {
  authStatus: AuthStatus;
  authProviderType: null | AuthProviderType;
  user: null | SupabaseUser;
  session: null | DbSession;
  // accessToken?
}

export interface RecoveryJSON {
  version: string;
  walletId: string;
  recoveryBackupShare: string;
  recoveryFileServerSignature: string;
}

export interface EmbeddedContextData extends EmbeddedContextState, EmbeddedContextAuth {
  currentWallet: Wallet | null;

  authenticate: (authProviderType: AuthProviderType, email?: string, password?: string) => Promise<void>;
  fetchRecoverableAccounts: () => Promise<RecoverableAccount[]>;
  clearRecoverableAccounts: () => void;
  recoverAccount: (authProviderType: AuthProviderType, accountToRecoverId: string) => Promise<void>;
  recoverWallet: (recoveryData: RecoveryJSON | JWKInterface | string) => Promise<void>;

  generateTempWallet: () => Promise<TempWallet>;
  deleteGeneratedTempWallet: () => Promise<void>;

  importTempWallet: (jwkOrSeedPhrase: JWKInterface | string) => Promise<TempWallet>;
  deleteImportedTempWallet: () => Promise<void>;

  registerWallet: (sourceType: WalletSourceType) => Promise<Wallet>;
  clearLastRegisteredWallet: () => void;

  skipBackUp: (doNotAskAgain: boolean) => void | Promise<void>;
  downloadKeyfile: () => Promise<void>;
  copySeedphrase: () => Promise<boolean>;
  getSeedphrase: (callbackFn?: (seedPhrase: string) => Promise<boolean>) => Promise<string>;
  generateRecoveryAndDownload: () => Promise<void>;
  setAuthEmail: (email: string) => void;
  setAuthPassword: (password: string) => void;
}
