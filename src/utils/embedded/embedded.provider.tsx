import type { JWKInterface } from "arweave/web/lib/wallet";
import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { setupBackgroundService } from "~api/background/background-setup";
import { WalletService } from "~utils/wallets/wallets.service";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { getKeyfile, getWallets, type LocalWallet } from "~wallets";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  downloadKeyfile as downloadKeyfileUtil,
  downloadRecoveryFile,
  type DownloadRecoveryFileData,
} from "~utils/file";
import { sleep } from "~utils/promises/sleep";
import type {
  EmbeddedContextState,
  EmbeddedContextData,
  EmbeddedProviderProps,
  TempWallet,
  AuthStatus,
  TempWalletPromise,
  RecoveryJSON,
  EmbeddedContextAuth,
  Wallet,
  OAutProviderType,
  AuthEmailParams,
} from "~utils/embedded/embedded.types";
import {
  setAuthTokenHeader,
  getSupabaseClient,
  signOut,
  getBackupsNeededAndMessage,
} from "~utils/embedded/embedded.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  AuthProviderType,
  ChallengeClientV1,
  WalletSourceType,
  type DbSession,
  type RecoverableAccount,
  type SupabaseUser,
} from "embed-api";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import { EMBEDDED_FEATURE_FLAGS, EMBEDDED_SDK_AUTH_STATUS_BY_AUTH_STATUS } from "~utils/embedded/embedded.constants";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";
import { jwtDecode } from "jwt-decode";
import type { SupabaseJwtPayload } from "~utils/authentication/authentication.types";
import { isTempWalletPromiseExpired } from "~utils/embedded/utils/wallets/embedded-wallets.utils";
import copy from "copy-to-clipboard";
import { getIPAddress } from "~utils/ip_address";
import {
  getAuthProviderTypeFromSupabaseUser,
  getUserDetailsFromSupabaseUser,
  postEmbeddedMessage,
} from "~utils/embedded/utils/messages/embedded-messages.utils";
import { ExtensionStorage, PersistentStorage, useStorage } from "~utils/storage";
import { StorageKeys } from "~utils/storage/storage.constants";
import {
  AO_TOKENS,
  AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS,
  AO_TOKENS_CACHE,
  AO_TOKENS_IDS,
  AO_TOKENS_IMPORT_TIMESTAMP,
  AO_TOKENS_LAST_BLOCK_HEIGHT,
} from "~tokens/aoTokens/sync";
import { loadTokens } from "~tokens/token";
import {
  getUnpartitionedStateStatus,
  UNPARTITIONED_STATE_STATUS_CHANGE_EVENT,
  type UnpartitionedStateStatusChangeEvent,
} from "~iframe/storage/unpartitioned-storage/unpartitioned-storage.utils";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { isomorphicOnMessage } from "~isomorphic-messaging";
import { useTheme } from "~components/embed/contexts/ThemeContext";
import { withRetry } from "~utils/promises/retry";
import { useLocation } from "~wallets/router/router.utils";
import { navigate } from "wouter/use-hash-location";

export type AuthStatusCopy = AuthStatus;

const EMBEDDED_CONTEXT_INITIAL_STATE = {
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
} as const satisfies EmbeddedContextState;

const EMBEDDED_CONTEXT_INITIAL_AUTH = {
  authStatus: "unknown",
  authProviderType: null,
  user: null,
  session: null,
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

  // TODO: These should work for multiple wallets:
  downloadKeyfile: async () => null,
  copySeedphrase: async () => null,
  getSeedphrase: async () => null,
  getDecryptedWallet: async () => null,
  generateRecoveryAndDownload: async () => null,
});

export function EmbeddedProvider({ children }: EmbeddedProviderProps) {
  const [embeddedContextState, setEmbeddedContextState] =
    useState<EmbeddedContextState>(EMBEDDED_CONTEXT_INITIAL_STATE);

  const [embeddedContextAuth, setEmbeddedContextAuth] = useState<EmbeddedContextAuth>(EMBEDDED_CONTEXT_INITIAL_AUTH);

  const [unpartitionedStateStatus, setUnpartitionedStateStatus] = useState(() => getUnpartitionedStateStatus());

  const [unpartitionedStateConfirmed, setUnpartitionedStateConfirmed, { setRenderValue }] = useStorage<boolean>({
    key: StorageKeys.CONNECT.SUPPORT.UNPARTITIONED_STATE_CONFIRMED,
    instance: PersistentStorage,
  });

  const confirmUnpartitionedState = useCallback(
    async (doNotAskAgain: boolean) => {
      if (doNotAskAgain) return setUnpartitionedStateConfirmed(true);
      else setRenderValue(true);
    },
    [setUnpartitionedStateConfirmed, setRenderValue],
  );

  // Unpartitioned state:

  useEffect(() => {
    function handleBanner(event: UnpartitionedStateStatusChangeEvent) {
      const { unpartitionedStateStatus } = event.detail;

      console.log("unpartitionedStateStatus EVENT =", unpartitionedStateStatus);

      if (unpartitionedStateStatus) setUnpartitionedStateStatus(unpartitionedStateStatus);
    }

    console.log("Started listening for unpartitionedStateStatus EVENT");

    document.addEventListener(UNPARTITIONED_STATE_STATUS_CHANGE_EVENT, handleBanner);

    return () => document.removeEventListener(UNPARTITIONED_STATE_STATUS_CHANGE_EVENT, handleBanner);
  }, []);

  // Wallet props:

  const { currentWalletId: walletId, wallets } = embeddedContextState;

  const { currentWallet, walletCount } = useMemo(() => {
    const currentWallet =
      wallets.find((wallet) => {
        return wallet.id === walletId;
      }) || null;

    return {
      currentWallet,
      walletCount: wallets.length,
    };
  }, [wallets, walletId]);

  const walletAddress = currentWallet?.address;

  // Auth props:

  const { authStatus, authProviderType, user, session } = embeddedContextAuth;
  const { backupsNeeded, backupMessage } = embeddedContextState;
  const userId = user?.id || null;

  useEffect(() => {
    if (authStatus !== "unknown") {
      const coverElement = document.getElementById("cover");

      if (coverElement) {
        coverElement.setAttribute("aria-hidden", "true");
      }
    }

    if (authStatus === "noAuth") {
      postEmbeddedMessage({
        type: "embedded_auth",
        data: {
          authType: null,
          authStatus: "not-authenticated",
          userDetails: null,
        },
      });

      return;
    }

    const sdkAuthStatus = EMBEDDED_SDK_AUTH_STATUS_BY_AUTH_STATUS[authStatus];

    if (!sdkAuthStatus) return;

    const userDetails = getUserDetailsFromSupabaseUser(user);

    postEmbeddedMessage({
      type: "embedded_auth",
      data: {
        authType: authProviderType,
        authStatus: sdkAuthStatus,
        userDetails,
      },
    });
  }, [authStatus, authProviderType, user]);

  useEffect(() => {
    if (authStatus !== "unlocked") return;

    postEmbeddedMessage({
      type: "embedded_backup",
      data: {
        backupsNeeded,
        backupMessage,
      },
    });
  }, [authStatus, backupsNeeded, backupMessage]);

  const getLatestSession = useCallback(async (session: DbSession) => {
    if (!session) {
      return {
        id: "",
        deviceNonce: "",
        ip: "",
        userAgent: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
      };
    }

    const userAgent = navigator.userAgent;
    const deviceNonce = await getDeviceNonce();
    // NOTE: We use ipv4 address here as in Vercel backend we get ipv4 address from the request headers.
    const ip = await getIPAddress().catch(() => session.ip);

    return {
      ...session,
      ip,
      userAgent,
      deviceNonce,
    };
  }, []);

  const updateCurrentWallet = useCallback((walletUpdater: Wallet | ((currentWallet: Wallet) => Wallet)) => {
    setEmbeddedContextState((prevEmbeddedContextState) => {
      const currentWalletIndex = prevEmbeddedContextState.wallets.findIndex((wallet) => {
        return wallet.id === prevEmbeddedContextState.currentWalletId;
      });

      const currentWallet = prevEmbeddedContextState.wallets[currentWalletIndex];

      if (!currentWallet) throw new Error(`No wallet with ID = "${prevEmbeddedContextState.currentWalletId}" found.`);

      const wallets = [...prevEmbeddedContextState.wallets];

      wallets[currentWalletIndex] = typeof walletUpdater === "object" ? walletUpdater : walletUpdater(currentWallet);

      return {
        ...prevEmbeddedContextState,
        wallets,
        ...getBackupsNeededAndMessage(wallets),
      };
    });
  }, []);

  const downloadKeyfile = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `downloadKeyfile()`);

    // TODO: Add an option to encrypt with a password

    const decryptedWallet = (await getKeyfile(walletAddress)) as LocalWallet<JWKInterface>;

    downloadKeyfileUtil(walletAddress, decryptedWallet.keyfile);

    // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
    freeDecryptedWallet(decryptedWallet.keyfile);

    const { wallet: updatedWallet } = await WalletService.registerWalletExport({
      walletId,
      type: "KEYFILE",
    });

    updateCurrentWallet((currentWallet) => ({
      ...currentWallet,
      ...updatedWallet,
    }));
  }, [walletId, walletAddress, updateCurrentWallet]);

  const getSeedphrase = useCallback(
    async (callbackFn?: (seedPhrase: string) => Promise<boolean>) => {
      log(LOG_GROUP.EMBEDDED_FLOWS, `getSeedphrase()`);

      const decryptedWallet = (await getKeyfile(walletAddress)) as LocalWallet<JWKInterface>;

      const jwk = decryptedWallet.keyfile;

      const seedPhrase = await WalletUtils.getDecryptedSeedPhrase(walletId, jwk);

      const success = callbackFn ? await callbackFn(seedPhrase) : true;

      if (success) {
        try {
          const { wallet: updatedWallet } = await WalletService.registerWalletExport({
            walletId,
            type: "SEEDPHRASE",
          });

          updateCurrentWallet((currentWallet) => ({
            ...currentWallet,
            ...updatedWallet,
          }));
        } catch (error) {
          console.error("Failed to register wallet export:", error);
        }
      }

      return seedPhrase;
    },
    [walletId, walletAddress],
  );

  const getDecryptedWallet = useCallback(async (): Promise<LocalWallet<JWKInterface>> => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `getDecryptedWallet()`);

    const decryptedWallet = (await getKeyfile(walletAddress)) as LocalWallet<JWKInterface>;

    /*

    This is probably a bad idea, because seeing the QR code doesn't guarantee the user has a copy of it. I think we need
    to update the backend to include a new QR type for this, and either make that type not update the export count (so
    that we keep prompting users to back up) or include a download button that downloads the QR as GIF/video. In that
    case, we only register this when they click download, not when we decrypt the keyfile. That means users should be
    able to upload that QR code too. In that case, it might be easier to parse if we include the JWK JSON in it as
    metadata (wondering if any upload service like Drive or Dropbox would automatically get rid of that metadata).

    try {
      const { wallet: updatedWallet } = await WalletService.registerWalletExport({
        walletId,
        type: "KEYFILE",
      });

      updateCurrentWallet((currentWallet) => ({
        ...currentWallet,
        ...updatedWallet,
      }));
    } catch (error) {
      console.error("Failed to register wallet export:", error);
    }
    */

    return decryptedWallet;
  }, [walletId, walletAddress]);

  const copySeedphrase = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `copySeedphrase()`);

    let successfulCopy = false;

    await getSeedphrase(async (seedPhrase) => {
      successfulCopy = await copy(seedPhrase);

      return successfulCopy;
    });

    return successfulCopy;
  }, [getSeedphrase]);

  const generateRecoveryAndDownload = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `generateRecoveryAndDownload()`);

    const decryptedWallet = (await getKeyfile(walletAddress)) as LocalWallet<JWKInterface>;

    const jwk = decryptedWallet.keyfile;

    let recoveryFileData: DownloadRecoveryFileData = {
      walletId,
      recoveryBackupShare: "",
      recoveryFileServerSignature: "",
    };

    const hasRecoveryShareLocally = await hasStoredRecoveryShare();
    if (hasRecoveryShareLocally) {
      const storedRecovery = await retrieveStoredRecoveryShare();
      if (storedRecovery) {
        recoveryFileData = storedRecovery;
      }
    }

    if (!recoveryFileData.recoveryBackupShare && !recoveryFileData.recoveryFileServerSignature) {
      const { recoveryAuthShare, recoveryBackupShare } = await WalletUtils.generateWalletRecoveryShares(jwk);

      const { shareHash: recoveryBackupShareHash, sharePublicKey: recoveryBackupSharePublicKey } =
        await WalletUtils.generateShareHashAndPublicKey(recoveryBackupShare);

      const { recoveryFileServerSignature, wallet: updatedWallet } = await WalletService.registerRecoveryShare({
        walletId,
        recoveryAuthShare,
        recoveryBackupShareHash,
        recoveryBackupSharePublicKey,
      });

      updateCurrentWallet((currentWallet) => ({
        ...currentWallet,
        ...updatedWallet,
      }));

      recoveryFileData = {
        ...recoveryFileData,
        recoveryBackupShare,
        recoveryFileServerSignature,
      };

      // Store encrypted recovery share in local storage if feature flag is enabled
      if (EMBEDDED_FEATURE_FLAGS.STORE_RECOVERY_SHARES) {
        try {
          // Create the recovery file data
          const recoveryData = {
            version: "1",
            ...recoveryFileData,
          } as RecoveryJSON;

          await WalletUtils.storeEncryptedRecoveryShare(walletId, recoveryData, jwk);
        } catch (error) {
          console.error("Failed to store recovery share:", error);
        }
      }
    }

    // Download the recovery file for the user
    downloadRecoveryFile(walletAddress, recoveryFileData);

    // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
    freeDecryptedWallet(jwk);
  }, [walletId, walletAddress]);

  // Check if a wallet has a stored recovery share
  const hasStoredRecoveryShare = useCallback(async (): Promise<boolean> => {
    if (!walletId || !EMBEDDED_FEATURE_FLAGS.STORE_RECOVERY_SHARES) {
      return false;
    }

    return await WalletUtils.hasEncryptedRecoveryShare(walletId);
  }, [walletId]);

  // Retrieve a stored recovery share
  const retrieveStoredRecoveryShare = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `retrieveStoredRecoveryShare()`);

    if (!walletId || !EMBEDDED_FEATURE_FLAGS.STORE_RECOVERY_SHARES) {
      return null;
    }

    if (!(await WalletUtils.hasEncryptedRecoveryShare(walletId))) {
      return null;
    }

    try {
      const decryptedWallet = (await getKeyfile(walletAddress)) as LocalWallet<JWKInterface>;

      const jwk = decryptedWallet.keyfile;

      const recoveryShare = await WalletUtils.getDecryptedRecoveryShare(walletId, jwk);

      // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
      freeDecryptedWallet(jwk);

      return recoveryShare;
    } catch (error) {
      console.error("Failed to retrieve stored recovery share:", error);
      return null;
    }
  }, [walletId, walletAddress]);

  // TODO: Need to observe storage to keep track of new wallets, removed wallets or active wallet changes... Or just
  // migrate wallet management to Mobx altogether for both extensions...

  const addWallet = useCallback(async (jwk: JWKInterface, wallet: Wallet, isNewWallet = false) => {
    // TODO: Add wallet to ExtensionStorage, but make sure to:
    // - Remove/update alarm to NOT remove it.
    // - Rotate it with newly generated passwords?
    // - Storage in the embedded wallet must be temp (memory).
    // - Router should force users out the auth screens
    // - See if signing, etc. works.

    await WalletUtils.storeEncryptedWalletJWK(jwk);

    freeDecryptedWallet(jwk);

    log(LOG_GROUP.WALLET_GENERATION, `getWallets() =`, await getWallets());

    // Optimistically add wallet.
    // TODO: We could consider calling `initEmbeddedWallet` again instead, which will make sure the wallet has been
    // properly added to the backend as well.

    setEmbeddedContextState(({ wallets: prevWallets, requestPasswordChange }) => {
      const wallets = [...prevWallets];
      const walletIDs = wallets.map((wallet) => wallet.id);

      if (!walletIDs.includes(wallet.id)) {
        wallets.push(wallet);
      }

      return {
        ...EMBEDDED_CONTEXT_INITIAL_STATE,
        currentWalletId: wallet.id,
        wallets,
        ...getBackupsNeededAndMessage(wallets),
        lastRegisteredWallet: isNewWallet ? wallet : null,
        requestPasswordChange,
      } satisfies EmbeddedContextState;
    });

    setEmbeddedContextAuth((prevEmbeddedContextAuth) => ({
      ...prevEmbeddedContextAuth,
      authStatus: "unlocked",
    }));
  }, []);

  // GENERATE WALLET:

  const generatedTempWalletPromiseRef = useRef<null | TempWalletPromise>(null);

  const deleteGeneratedTempWallet = useCallback(async () => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      generatedTempWalletAddress: null,
    }));

    const generatedTempWalletPromise = generatedTempWalletPromiseRef.current;

    if (generatedTempWalletPromise) {
      generatedTempWalletPromise.controller.abort();

      const tempWallet = await Promise.race([generatedTempWalletPromise.promise, sleep(1)]);

      if (tempWallet) {
        log(LOG_GROUP.WALLET_GENERATION, `deleteGeneratedTempWallet()`);

        freeDecryptedWallet(tempWallet.jwk);
      }
    }

    generatedTempWalletPromiseRef.current = null;
  }, []);

  const generateTempWallet = useCallback(() => {
    const generatedTempWalletPromise = generatedTempWalletPromiseRef.current;

    if (generatedTempWalletPromise && !isTempWalletPromiseExpired(generatedTempWalletPromise)) {
      return generatedTempWalletPromise.promise;
    }

    deleteGeneratedTempWallet();

    log(LOG_GROUP.WALLET_GENERATION, `generateTempWallet()`);

    const controller = new AbortController();
    const { signal } = controller;

    const promise: Promise<TempWallet> = new Promise(async (resolve, reject) => {
      signal.addEventListener("abort", reject);

      const seedPhrase = await WalletUtils.generateSeedPhrase();
      const jwk = await WalletUtils.generateWalletJWK(seedPhrase);
      const arweave = new Arweave(defaultGateway);
      const walletAddress = await arweave.wallets.jwkToAddress(jwk);

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        generatedTempWalletAddress: walletAddress,
      }));

      resolve({
        seedPhrase,
        jwk,
        walletAddress,
      });

      signal.removeEventListener("abort", reject);
    });

    generatedTempWalletPromiseRef.current = {
      createdAt: Date.now(),
      promise,
      controller,
    };

    return promise;
  }, []);

  // IMPORT WALLET:

  const importedTempWalletPromiseRef = useRef<null | TempWalletPromise>();

  // This function is called in the import views when users don't confirm the import or when they leave the screen:

  const deleteImportedTempWallet = useCallback(async () => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      importedTempWalletAddress: null,
    }));

    const importedTempWalletPromise = importedTempWalletPromiseRef.current;

    if (importedTempWalletPromise) {
      importedTempWalletPromise.controller.abort();

      const tempWallet = await Promise.race([importedTempWalletPromise.promise, sleep(1)]);

      if (tempWallet) {
        log(LOG_GROUP.WALLET_GENERATION, `deleteImportedTempWallet()`);

        freeDecryptedWallet(tempWallet.jwk);
      }
    }

    importedTempWalletPromiseRef.current = null;
  }, []);

  const importTempWallet = useCallback(async (jwkOrSeedPhrase: JWKInterface | string) => {
    await deleteImportedTempWallet();

    log(LOG_GROUP.WALLET_GENERATION, `importTempWallet()`);

    const controller = new AbortController();
    const { signal } = controller;

    const promise: Promise<TempWallet> = new Promise(async (resolve, reject) => {
      signal.addEventListener("abort", reject);

      const importedSeedPhrase: string | null = typeof jwkOrSeedPhrase === "string" ? jwkOrSeedPhrase : null;
      const importedJWK: JWKInterface | null = typeof jwkOrSeedPhrase === "string" ? null : jwkOrSeedPhrase;
      const jwk = importedJWK || (await WalletUtils.generateWalletJWK(importedSeedPhrase));
      const arweave = new Arweave(defaultGateway);
      const walletAddress = await arweave.wallets.jwkToAddress(jwk);

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        importedTempWalletAddress: walletAddress,
      }));

      resolve({
        seedPhrase: importedSeedPhrase,
        jwk,
        walletAddress,
      });

      signal.removeEventListener("abort", reject);
    });

    importedTempWalletPromiseRef.current = {
      createdAt: Date.now(),
      promise,
      controller,
    };

    return promise;
  }, []);

  // REGISTER WALLET:

  const registerWallet = useCallback(
    async (sourceType: WalletSourceType) => {
      log(LOG_GROUP.WALLET_GENERATION, `registerWallet(${sourceType})`);

      if (authStatus === "noShares") {
        await Promise.all(
          wallets.map(({ id: walletId, status }) =>
            status === "ENABLED" ? WalletService.updateWalletStatus({ walletId, status: "LOST" }) : null,
          ),
        );

        setEmbeddedContextState((prevAuthContextState) => ({
          ...prevAuthContextState,
          wallets: prevAuthContextState.wallets.map((wallet) => ({
            ...wallet,
            status: wallet.status === "ENABLED" ? "LOST" : wallet.status,
          })),
        }));
      }

      const promise =
        sourceType === "GENERATED"
          ? generatedTempWalletPromiseRef.current?.promise
          : importedTempWalletPromiseRef.current?.promise;

      const { seedPhrase, jwk, walletAddress } = await promise;

      const { authShare, deviceShare } = await WalletUtils.generateWalletWorkShares(jwk);

      const { shareHash: deviceShareHash, sharePublicKey: deviceSharePublicKey } =
        await WalletUtils.generateShareHashAndPublicKey(deviceShare);

      const { wallet: createdWallet } = await WalletService.createPublicWallet({
        address: walletAddress,
        publicKey: jwk.n,
        authShare,
        deviceShareHash,
        deviceSharePublicKey,
        source: {
          type: sourceType,
          from: seedPhrase ? "SEEDPHRASE" : "KEYFILE",
        },
      });

      const wallet: Wallet = {
        ...createdWallet,
        activationStatus: "active",
        authShare,
        deviceShare,
      };

      await WalletUtils.storeDeviceShare(wallet, userId);

      if (seedPhrase && EMBEDDED_FEATURE_FLAGS.STORE_SEED_PHRASE) {
        await WalletUtils.storeEncryptedSeedPhrase(wallet.id, seedPhrase, jwk);
      }

      try {
        await addWallet(jwk, wallet, true);
      } finally {
        freeDecryptedWallet(jwk);
      }

      return wallet;
    },
    [wallets, userId],
  );

  const clearLastRegisteredWallet = useCallback(() => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      lastRegisteredWallet: null,
    }));
  }, []);

  // ACCOUNT RECOVERY:

  const fetchRecoverableAccounts = useCallback(async () => {
    log(LOG_GROUP.WALLET_GENERATION, `fetchRecoverableAccounts()`);

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts: null,
    }));

    const { jwk, walletAddress } = await importedTempWalletPromiseRef.current?.promise;

    const latestSession = await getLatestSession(session);

    const { fetchRecoverableWalletsChallenge } =
      await AuthenticationService.generateFetchRecoverableAccountsChallenge(walletAddress);

    const challengeSolution = await ChallengeClientV1.solveChallenge({
      challenge: fetchRecoverableWalletsChallenge,
      session: latestSession,
      shareHash: null,
      jwk,
    });

    const { recoverableAccounts } = await AuthenticationService.fetchRecoverableAccounts(
      fetchRecoverableWalletsChallenge.id,
      challengeSolution,
    );

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts,
      recoverableAccount: recoverableAccounts.length === 1 ? recoverableAccounts[0] : null,
    }));

    return recoverableAccounts;
  }, [session]);

  const fetchRecoverableAccountWallets = useCallback(
    async (recoverableAccount: RecoverableAccount) => {
      log(LOG_GROUP.WALLET_GENERATION, `fetchRecoverableAccountWallets(${recoverableAccount.userId})`);

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        recoverableAccountWallets: null,
      }));

      const { jwk, walletAddress } = await importedTempWalletPromiseRef.current?.promise;

      const latestSession = await getLatestSession(session);

      const { fetchRecoverableWalletsChallenge } =
        await AuthenticationService.generateFetchRecoverableAccountsChallenge(walletAddress);

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: fetchRecoverableWalletsChallenge,
        session: latestSession,
        shareHash: null,
        jwk,
      });

      const { recoverableAccountWallets } = await AuthenticationService.fetchRecoverableAccountWallets(
        fetchRecoverableWalletsChallenge.id,
        challengeSolution,
        recoverableAccount.userId,
      );

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        recoverableAccountWallets,
      }));

      return recoverableAccountWallets;
    },
    [session],
  );

  const setRecoverableAccount = useCallback((recoverableAccount: RecoverableAccount) => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccount,
    }));
  }, []);

  const setRecoverableAccountWallets = useCallback((recoverableAccountWallets: Wallet[]) => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccountWallets,
    }));
  }, []);

  const clearRecoverableAccounts = useCallback(() => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts: null,
      recoverableAccount: null,
      recoverableAccountWallets: null,
    }));
  }, []);

  const recoverAccount = useCallback(
    async (authProviderType: AuthProviderType, accountToRecoverId: string) => {
      log(LOG_GROUP.WALLET_GENERATION, `recoverAccount(${authProviderType}, ${accountToRecoverId})`);

      const { jwk, walletAddress } = await importedTempWalletPromiseRef.current?.promise;

      let latestSession = await getLatestSession(session);

      const { accountRecoveryChallenge } = await AuthenticationService.generateAccountRecoveryChallenge(
        walletAddress,
        accountToRecoverId,
      );

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: accountRecoveryChallenge,
        session: latestSession,
        shareHash: null,
        jwk,
      });

      await AuthenticationService.recoverAccount(accountToRecoverId, challengeSolution);

      latestSession = await getLatestSession(session);
      lastUserIdRef.current = null;
      await initEmbeddedWallet(session.userId, latestSession);
    },
    [session],
  );

  const recoverWallet = useCallback(
    async (recoveryData?: RecoveryJSON | JWKInterface | string) => {
      let jwk: JWKInterface;
      let seedPhrase: string | null = null;
      let walletAddress: string;
      let walletId: string;
      let recoveryBackupShare: string | null = null;
      let recoveryFileServerSignature: string | null = null;
      let recoveryBackupShareHash: string | null = null;
      let recoveryBackupSharePrivateKeyJWK: JWKInterface | null = null;
      let isRecoveryJSON = true;

      if (
        (!recoveryData || WalletUtils.isJWK(recoveryData) || WalletUtils.isSeedPhrase(recoveryData)) &&
        importedTempWalletPromiseRef.current?.promise
      ) {
        const promise = importedTempWalletPromiseRef.current?.promise;
        ({ jwk, walletAddress, seedPhrase } = await promise);
        walletId = wallets.find(({ address }) => address === walletAddress)?.id;
        if (!recoveryData && seedPhrase && EMBEDDED_FEATURE_FLAGS.STORE_SEED_PHRASE) {
          await WalletUtils.storeEncryptedSeedPhrase(walletId, seedPhrase, jwk).catch(() => {});
        }
        isRecoveryJSON = false;
      } else if (WalletUtils.isRecoveryJSON(recoveryData)) {
        ({ walletId, recoveryBackupShare, recoveryFileServerSignature } = recoveryData as RecoveryJSON);
        ({ shareHash: recoveryBackupShareHash, sharePrivateKeyJWK: recoveryBackupSharePrivateKeyJWK } =
          await WalletUtils.generateShareHashAndPrivateKey(recoveryBackupShare));
        walletAddress = wallets.find(({ id }) => id === walletId)?.address;
      } else {
        // TODO: Move error to constant:
        throw new Error("Invalid file. Is this a recovery or keyfile?");
      }

      if (!walletId || !walletAddress) {
        // TODO: Move error to constant:
        throw new Error("This wallet doesn't belong to this account.");
      }

      const latestSession = await getLatestSession(session);

      const { shareRecoveryChallenge } = await WalletService.generateWalletRecoveryChallenge({ walletId });

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: shareRecoveryChallenge,
        session: latestSession,
        shareHash: recoveryBackupShareHash,
        jwk: recoveryBackupSharePrivateKeyJWK || jwk,
      });

      let recoverWalletParams = { walletId, challengeSolution };
      if (isRecoveryJSON) {
        recoverWalletParams = {
          ...recoverWalletParams,
          ...(recoveryBackupShareHash ? { recoveryBackupShareHash } : {}),
          ...(recoveryFileServerSignature ? { recoveryFileServerSignature } : {}),
        };
      }

      const authRecoveryShareResponse = await WalletService.recoverWallet(recoverWalletParams);

      if (isRecoveryJSON && !("recoveryAuthShare" in authRecoveryShareResponse)) {
        throw new Error("Recovery share not found.");

        // TODO: Validate file signature and show a proper error message...
      }

      const { recoveryAuthShare, rotationChallenge } = authRecoveryShareResponse;

      if (isRecoveryJSON) {
        jwk = await WalletUtils.generateWalletJWKFromShares(walletAddress, [recoveryAuthShare, recoveryBackupShare]);
      }

      const { authShare, deviceShare } = await WalletUtils.generateWalletWorkShares(jwk);

      const rotateChallengeSignature = await ChallengeClientV1.solveChallenge({
        challenge: rotationChallenge,
        session: latestSession,
        shareHash: null,
        jwk,
      });

      const { shareHash: deviceShareHash, sharePublicKey: deviceSharePublicKey } =
        await WalletUtils.generateShareHashAndPublicKey(deviceShare);

      const registerAuthShareResponse = await WalletService.registerAuthShare({
        walletId,
        authShare,
        deviceShareHash,
        deviceSharePublicKey,
        challengeSolution: rotateChallengeSignature,
      });

      const dbWallet = registerAuthShareResponse.wallet;

      const wallet: Wallet = {
        ...dbWallet,
        activationStatus: "active",
        authShare,
        deviceShare,
      };

      await WalletUtils.storeDeviceShare(wallet, userId);

      try {
        await addWallet(jwk, wallet);
      } finally {
        freeDecryptedWallet(jwk);
      }
    },
    [session, userId, wallets],
  );

  const setRequestPasswordChange = useCallback((requestPasswordChange: boolean) => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      requestPasswordChange,
    }));
  }, []);

  // AUTHENTICATION:

  /*
  const refreshSession = async (session?: DbSession) => {
    const supabase = await getSupabaseClient();
    const {
      data: { session: refreshedSession },
    } = await supabase.auth.refreshSession();

    const accessToken = refreshedSession?.access_token;
    if (accessToken) {
      setAuthTokenHeader(accessToken);
      const { sub, session_id: sessionId, sessionData } = jwtDecode<SupabaseJwtPayload>(accessToken);

      session = {
        ...sessionData,
        id: sessionId,
        userId: sub,
      };
    }

    return session;
  };
  */

  const authenticate = useCallback(
    async (authParams: OAutProviderType | AuthEmailParams) => {
      if (user) throw new Error("Already authenticated.");

      const authProviderType: AuthProviderType = typeof authParams === "string" ? authParams : "EMAIL_N_PASSWORD";

      try {
        setEmbeddedContextAuth({
          authStatus: "authLoading",
          authProviderType,
          user: null,
          session: null,
        });

        if (typeof authParams === "string") {
          await AuthenticationService.authenticateWithOAuth(authParams);
        } else if (authParams.method === "signInWithPassword") {
          await AuthenticationService.signInWithPassword(authParams);
        } else if (authParams.method === "verifyOtp") {
          await AuthenticationService.verifyOtp(authParams);
        }
      } catch (error) {
        console.error(`authenticate(${authProviderType}) error =`, error);

        setEmbeddedContextAuth({
          authStatus: "authError",
          authProviderType: null,
          user: null,
          session: null,
        });

        throw error;
      } finally {
        PersistentStorage.set(StorageKeys.CONNECT.AUTH.IS_USING_BE, false);
      }
    },
    [user],
  );

  // INITIALIZATION:

  const lastUserIdRef = useRef<string | null>(null);

  const initEmbeddedWallet = useCallback(async (userId?: string | null, session?: DbSession | null) => {
    if (lastUserIdRef.current === userId) return;

    lastUserIdRef.current = userId;

    if (userId && userId !== (await PersistentStorage.get<string>(StorageKeys.CONNECT.AUTH.USER_ID))) {
      try {
        // TODO: This is a TEMP FIX to prevent users who share the same device from seeing someone else's tokens and
        // connected apps when logging in with a different account, until we properly namespace those settings by user
        // and/or wallet address. Note that because `PersistentStorage` is a wrapper around `localStorage`, calling
        // PersistentStorage.removeAll() will also remove the deviceNonce and key shares, so do not.

        const lastBlockHeightKeys = Object.keys(localStorage).filter((localStorageKey) => {
          return localStorageKey.startsWith(`${AO_TOKENS_LAST_BLOCK_HEIGHT}_`);
        });

        const appsKeys = Object.keys(localStorage).filter((localStorageKey) => {
          return localStorageKey.startsWith(`app_`);
        });

        await Promise.allSettled([
          // Storage the user ID to check next time if it's the same one or a different one:
          PersistentStorage.set(StorageKeys.CONNECT.AUTH.USER_ID, userId),

          // All these reset the token list and balances:
          PersistentStorage.remove(AO_TOKENS),
          PersistentStorage.remove(AO_TOKENS_CACHE),
          PersistentStorage.remove(AO_TOKENS_IDS),
          PersistentStorage.remove(AO_TOKENS_IMPORT_TIMESTAMP),
          PersistentStorage.remove(AO_TOKENS_LAST_BLOCK_HEIGHT),
          PersistentStorage.remove(AO_TOKENS_AUTO_IMPORT_RESTRICTED_IDS),
          PersistentStorage.removeItems(lastBlockHeightKeys),

          // No need to remove this one:
          // PersistentStorage.remove("last_saved_price"),

          // These 3 ones get rid of the connected apps:
          PersistentStorage.remove("is_permissions_reset"),
          PersistentStorage.remove("apps"),
          PersistentStorage.removeItems(appsKeys),

          // This was already executed on signOut(), but just in case...:
          ExtensionStorage.removeAll(),
        ]);

        // Because the background services have already been started, let's re-run this now that we've cleared the storage:
        await loadTokens();
      } catch (err) {
        console.error("Error clearing previous user data:", err);
      }
    }

    setEmbeddedContextState((prevAuthContextState) => ({
      ...EMBEDDED_CONTEXT_INITIAL_STATE,
      recoverableAccounts: prevAuthContextState.recoverableAccounts,
      recoverableAccount: prevAuthContextState.recoverableAccount,
      recoverableAccountWallets: prevAuthContextState.recoverableAccountWallets,
      requestPasswordChange: prevAuthContextState.requestPasswordChange,
    }));

    if (!userId || !session) {
      generateTempWallet();

      return;
    }

    const wallets = await WalletService.fetchWallets(userId);

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      currentWalletId: wallets?.[0]?.id || null,
      wallets,
      ...getBackupsNeededAndMessage(wallets),
    }));

    let authStatus: AuthStatus = wallets.length === 0 ? "noWallets" : "noShares";

    if (wallets.length > 0) {
      // TODO: The wallet activation can be deferred until the wallet is going to be used:

      // TODO: If we think the wallets are lost, we just show a different screen like the "add wallet"
      // one but with a different message.

      // TODO: Create an issue for the new storage needs (e.g. expiration). Note that for wallets
      // that haven't been backup up, we must never delete a share without notifying the user.

      let jwk: JWKInterface | null = null;

      try {
        // TODO: Add some extra logic here to wait if there are other tabs activating a wallet at the same time.
        // Do it by checking both a stored flag as well as by querying the backend (subscribe?).

        const fetchFirstAvailableAuthShareReturn = await withRetry(() =>
          WalletService.fetchFirstAvailableAuthShare(wallets, session, userId),
        );

        const { activatedWallet } = fetchFirstAvailableAuthShareReturn;
        jwk = fetchFirstAvailableAuthShareReturn.jwk;

        if (jwk && activatedWallet) {
          await WalletUtils.storeDeviceShare(activatedWallet, userId);
          await addWallet(jwk, activatedWallet);

          authStatus = "unlocked";
        }
      } catch (err) {
        // All attempts failed, or activation suceded but some of the code afer that threw an error.

        console.warn("Failed to activate wallet:", err);
      } finally {
        if (jwk) freeDecryptedWallet(jwk);
      }
    }

    setEmbeddedContextAuth((prevEmbeddedContextAuth) => ({
      ...prevEmbeddedContextAuth,
      authStatus,
    }));
  }, []);

  const areBackgroundServicesInitialized = useRef(false);

  useAsyncEffect(async () => {
    if (areBackgroundServicesInitialized.current) return;

    areBackgroundServicesInitialized.current = true;

    log(LOG_GROUP.SETUP, `Initializing Wander Embedded background services...`);

    setupBackgroundService();
  }, []);

  useAsyncEffect(async () => {
    /*
    KNOWN AUTHENTICATION ISSUES:

    - The decoded JWT token sometimes is missing some properties (`deviceNonce`). Refreshing the
      sessions seems to fix the issue, but not immediately. The `The current session is incomplete. Refreshing...` block
      in `initEmbeddedWallet` is a dirty/temp fix for that.
    */

    const supabase = await getSupabaseClient();

    let isInitialAuthEventDispatched = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (isInitialAuthEventDispatched && _event === "INITIAL_SESSION") return;

      if (!isInitialAuthEventDispatched) {
        isInitialAuthEventDispatched = true;

        const cachedUser = session?.user as SupabaseUser;

        // Send the initial state for the SDK button ASAP if there's cached data. Otherwise, the initial state will be
        // sent by the `useEffect` above that sends `"embedded_auth"` events too.

        if (cachedUser) {
          if (_event === "INITIAL_SESSION") {
            supabase.auth.refreshSession();
          }

          postEmbeddedMessage({
            type: "embedded_auth",
            data: {
              authType: getAuthProviderTypeFromSupabaseUser(cachedUser),
              authStatus: "loading",
              userDetails: getUserDetailsFromSupabaseUser(cachedUser),
            },
          });
        }
      }

      const accessToken = session?.access_token ?? null;
      const user = (session?.user as SupabaseUser) ?? null;
      const authProviderType = getAuthProviderTypeFromSupabaseUser(user);

      if (process.env.NODE_ENV === "development" && user && authProviderType === null) {
        alert(
          `authProviderType = ${authProviderType}. Something wasn't properly mapped in AUTH_PROVIDER_TYPE_BY_PROVIDER_STR.`,
        );
      }

      let dbSession: DbSession | null = null;

      if (accessToken) {
        const { sub, session_id: sessionId, sessionData } = jwtDecode<SupabaseJwtPayload>(accessToken);

        dbSession = {
          ...sessionData,
          id: sessionId,
          userId: sub,
        };

        const deviceNonce = await getDeviceNonce();

        if (!dbSession.id || !dbSession.deviceNonce) {
          console.warn("❌  The current session is incomplete =", dbSession);
        } else if (dbSession.deviceNonce !== deviceNonce) {
          console.warn(
            `⚠️  The current session is complete, but the device nonce (${deviceNonce}) doesn't match =`,
            dbSession,
          );
        } else {
          console.log("✅  The current session is complete =", dbSession);
        }

        if (_event !== "TOKEN_REFRESHED" && (!dbSession.id || dbSession.deviceNonce !== deviceNonce)) {
          console.log("🔃 Refreshing session...");

          // We wait to leave some time for the trigger to update the session and make sure that, when we refresh, we
          // get the updated session data:
          await sleep(2500);

          supabase.auth.refreshSession();

          return;
        }

        dbSession = await getLatestSession(dbSession);
      }

      setAuthTokenHeader(accessToken);

      initEmbeddedWallet(user?.id || null, dbSession);

      if (authProviderType && user && dbSession) {
        setEmbeddedContextAuth(({ authStatus }) => ({
          authStatus: authStatus === "unknown" || authStatus === "authError" ? "authLoading" : authStatus,
          authProviderType,
          user,
          session: dbSession,
        }));
      } else {
        // TODO: Duplicated in initEmbeddedWallet()?
        setEmbeddedContextState((prevAuthContextState) => ({
          // ...prevAuthContextState,
          ...EMBEDDED_CONTEXT_INITIAL_STATE,
          recoverableAccounts: prevAuthContextState.recoverableAccounts,
          recoverableAccount: prevAuthContextState.recoverableAccount,
          recoverableAccountWallets: prevAuthContextState.recoverableAccountWallets,
          requestPasswordChange: prevAuthContextState.requestPasswordChange,
        }));

        setEmbeddedContextAuth({
          authStatus: "noAuth",
          authProviderType: null,
          user: null,
          session: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [initEmbeddedWallet]);

  const { setMode } = useTheme();

  const { navigate } = useLocation();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    isomorphicOnMessage("embedded_signOut", () => {
      signOut(false);
    });

    isomorphicOnMessage("embedded_setTheme", ({ data }) => {
      setMode(data);
    });

    isomorphicOnMessage("embedded_navigate", ({ data }) => {
      const navigate = navigateRef.current;

      if (data !== "backup" || !navigate) return;

      navigate("/account/backup-wallet");
    });
  }, []);

  console.log("unpartitionedStateStatus =", unpartitionedStateStatus);

  return (
    <EmbeddedContext.Provider
      value={{
        ...embeddedContextState,
        ...embeddedContextAuth,

        walletCount,
        currentWallet,

        unpartitionedStateStatus,
        unpartitionedStateConfirmed,
        confirmUnpartitionedState,

        authenticate,
        fetchRecoverableAccounts,
        clearRecoverableAccounts,
        setRecoverableAccount,
        fetchRecoverableAccountWallets,
        setRecoverableAccountWallets,
        recoverAccount,
        recoverWallet,
        setRequestPasswordChange,

        generateTempWallet,
        deleteGeneratedTempWallet,

        importTempWallet,
        deleteImportedTempWallet,

        registerWallet,
        clearLastRegisteredWallet,
        downloadKeyfile,
        copySeedphrase,
        getSeedphrase,
        getDecryptedWallet,
        generateRecoveryAndDownload,
      }}>
      {children}
    </EmbeddedContext.Provider>
  );
}
