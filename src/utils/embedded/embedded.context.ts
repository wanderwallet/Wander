import { createContext } from "react";
import { getUnpartitionedStateStatus } from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import type { EmbeddedContextAuth, EmbeddedContextData, EmbeddedContextState } from "~utils/embedded/embedded.types";
import { INITIAL_ANON_SESSION } from "~utils/embedded/session/session.utils";

export const EMBEDDED_CONTEXT_INITIAL_STATE = {
  currentWalletId: "",
  wallets: [],
  generatedTempWalletAddress: null,
  importedTempWalletAddress: null,
  lastRegisteredWallet: null,
  recoverableAccounts: null,
  recoverableAccount: null,
  recoverableAccountWallets: null,
  requestPasswordChange: false,
  backupsNeeded: 0,
  cloudProvider: null,
  cloudBackup: undefined,
} as const satisfies EmbeddedContextState;

export const EMBEDDED_CONTEXT_INITIAL_AUTH = {
  authStatus: "unknown",
  authProviderType: null,
  user: null,
  session: INITIAL_ANON_SESSION,
} as const satisfies EmbeddedContextAuth;

export const EmbeddedContext = createContext<EmbeddedContextData>({
  ...EMBEDDED_CONTEXT_INITIAL_STATE,
  ...EMBEDDED_CONTEXT_INITIAL_AUTH,

  walletCount: 0,
  currentWallet: null,

  unpartitionedStateStatus: getUnpartitionedStateStatus(),
  unpartitionedStateConfirmed: null,
  confirmUnpartitionedState: async () => null,

  authenticate: async () => null,
  fetchRecoverableAccounts: async () => null,
  clearRecoverableAccounts: async () => null,
  setRecoverableAccount: async () => null,
  setRecoverableAccountWallets: async () => null,
  fetchRecoverableAccountWallets: async () => null,
  recoverAccount: async () => null,
  recoverWallet: async () => null,
  setRequestPasswordChange: () => null,

  generateTempWallet: async () => null,
  deleteGeneratedTempWallet: async () => null,

  importTempWallet: async () => null,
  deleteImportedTempWallet: async () => null,

  registerWallet: async () => null,
  clearLastRegisteredWallet: () => null,

  setCloudProvider: () => null,
  setCloudBackup: () => null,

  // TODO: These should work for multiple wallets:
  downloadKeyfile: async () => null,
  copySeedphrase: async () => null,
  getSeedphrase: async () => null,
  getDecryptedWallet: async () => null,
  generateRecoveryAndDownload: async () => null,
});
