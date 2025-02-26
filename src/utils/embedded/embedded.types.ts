import type { PropsWithChildren } from "react";
import type { JWKInterface } from "arweave/web/lib/wallet";
import type {
  DbWallet,
  AuthProviderType,
  SupabaseUser,
  RecoverableAccount,
  WalletSourceType
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

export interface WalletInfo extends DbWallet {
  isActive: boolean;
  isReady: boolean;
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
  // Authentication:
  authStatus: AuthStatus;
  authProviderType: null | AuthProviderType;
  user: null | SupabaseUser;

  // Wallets:
  currentWalletId: string;
  wallets: WalletInfo[];
  generatedTempWalletAddress: null | string;
  importedTempWalletAddress: null | string;
  lastRegisteredWallet: null | DbWallet;
  recoverableAccounts: null | RecoverableAccount[];
}

export interface RecoveryJSON {
  version: string;
  walletId: string;
  recoveryBackupShare: string;
  recoveryFileServerSignature: string;
}

export interface EmbeddedContextData extends EmbeddedContextState {
  authenticate: (authProviderType: AuthProviderType) => Promise<void>;
  fetchRecoverableAccounts: () => Promise<RecoverableAccount[]>;
  clearRecoverableAccounts: () => void;
  recoverAccount: (
    authProviderType: AuthProviderType,
    accountToRecoverId: string
  ) => Promise<void>;
  recoverWallet: (
    recoveryData: RecoveryJSON | JWKInterface | string
  ) => Promise<void>;

  generateTempWallet: () => Promise<TempWallet>;
  deleteGeneratedTempWallet: () => Promise<void>;

  importTempWallet: (
    jwkOrSeedPhrase: JWKInterface | string
  ) => Promise<TempWallet>;
  deleteImportedTempWallet: () => Promise<void>;

  registerWallet: (sourceType: WalletSourceType) => Promise<DbWallet>;
  clearLastRegisteredWallet: () => void;

  skipBackUp: (doNotAskAgain: boolean) => void | Promise<void>;
  downloadKeyfile: () => Promise<void>;
  copySeedphrase: () => Promise<void>;
  generateRecoveryAndDownload: () => Promise<void>;
}
