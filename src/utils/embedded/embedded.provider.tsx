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
} from "~utils/embedded/embedded.types";
import { setAuthTokenHeader, getSupabaseClient } from "~utils/embedded/embedded.utils";
import { isInsideIframe } from "~utils/embedded/iframe.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { AuthProviderType, ChallengeClientV1, WalletSourceType, type DbSession } from "embed-api";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import {
  AUTH_PROVIDER_TYPE_BY_PROVIDER_STR,
  EMBEDDED_FEATURE_FLAGS,
  EMBEDDED_SDK_AUTH_STATUS_BY_AUTH_STATUS,
} from "~utils/embedded/embedded.constants";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";
import { jwtDecode } from "jwt-decode";
import type { SupabaseJwtPayload } from "~utils/authentication/authentication.types";
import { isTempWalletPromiseExpired } from "~utils/embedded/utils/wallets/embedded-wallets.utils";
import copy from "copy-to-clipboard";
import { useHashLocation } from "wouter/use-hash-location";
import { getIPAddress } from "~utils/ip_address";
import {
  getAuthProviderTypeFromSupabaseUser,
  getUserDetailsFromSupabaseUser,
  postEmbeddedMessage,
} from "~utils/embedded/utils/messages/embedded-messages.utils";

export type AuthStatusCopy = AuthStatus;

const EMBEDDED_CONTEXT_INITIAL_STATE = {
  currentWalletId: "",
  wallets: [],
  generatedTempWalletAddress: null,
  importedTempWalletAddress: null,
  lastRegisteredWallet: null,
  recoverableAccounts: null,
  authEmail: null,
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

  currentWallet: null,

  authenticate: async () => null,
  fetchRecoverableAccounts: async () => null,
  clearRecoverableAccounts: async () => null,
  recoverAccount: async () => null,
  recoverWallet: async () => null,

  generateTempWallet: async () => null,
  deleteGeneratedTempWallet: async () => null,

  importTempWallet: async () => null,
  deleteImportedTempWallet: async () => null,

  registerWallet: async () => null,
  clearLastRegisteredWallet: () => null,

  // TODO: These should work for multiple wallets:
  skipBackUp: () => null,
  downloadKeyfile: async () => null,
  copySeedphrase: async () => null,
  getSeedphrase: async () => null,
  generateRecoveryAndDownload: async () => null,

  // Supabase email auth
  setAuthEmail: () => null,
});

export function EmbeddedProvider({ children }: EmbeddedProviderProps) {
  const [embeddedContextState, setEmbeddedContextState] =
    useState<EmbeddedContextState>(EMBEDDED_CONTEXT_INITIAL_STATE);

  const [embeddedContextAuth, setEmbeddedContextAuth] = useState<EmbeddedContextAuth>(EMBEDDED_CONTEXT_INITIAL_AUTH);

  const [wocation] = useHashLocation();

  // Wallet props:

  const { currentWalletId: walletId, wallets } = embeddedContextState;

  const currentWallet = useMemo(() => {
    return (
      wallets.find((wallet) => {
        return wallet.id === walletId;
      }) || null
    );
  }, [wallets, walletId]);

  const walletAddress = currentWallet?.address;

  // Auth props:

  const { authProviderType, authStatus, user, session } = embeddedContextAuth;

  const userId = user?.id || null;

  useEffect(() => {
    if (authStatus !== "unknown") {
      const coverElement = document.getElementById("cover");

      if (coverElement) {
        coverElement.setAttribute("aria-hidden", "true");
      }
    }
  }, [authStatus]);

  useEffect(() => {
    const sdkAuthStatus = EMBEDDED_SDK_AUTH_STATUS_BY_AUTH_STATUS[authStatus];

    if (!authProviderType || !sdkAuthStatus) return;

    const userDetails = getUserDetailsFromSupabaseUser(user);

    postEmbeddedMessage({
      type: "embedded_auth",
      data: {
        authType: authProviderType,
        authStatus: sdkAuthStatus,
        userDetails,
      },
    });
  }, [authProviderType, authStatus, user]);

  const getLatestSession = useCallback(async (session: DbSession) => {
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
      };
    });
  }, []);

  const skipBackUp = useCallback(
    async (doNotAskAgainSetting: boolean) => {
      log(LOG_GROUP.EMBEDDED_FLOWS, `skipBackUp(${doNotAskAgainSetting})`);

      // TODO: Persist lastPromptData locally too?

      if (doNotAskAgainSetting) {
        const { wallet: updatedWallet } = await WalletService.doNotAskAgainForBackup({
          walletId,
        });

        updateCurrentWallet((currentWallet) => ({
          ...currentWallet,
          ...updatedWallet,
        }));
      } else {
        updateCurrentWallet((currentWallet) => ({
          ...currentWallet,
          doNotAskAgainSetting: true,
        }));
      }
    },
    [walletId, updateCurrentWallet],
  );

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
          console.log("Recovery share stored successfully");
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

    setEmbeddedContextState(({ wallets: prevWallets }) => {
      const wallets = [...prevWallets];
      const walletIDs = wallets.map((wallet) => wallet.id);

      if (!walletIDs.includes(wallet.id)) {
        wallets.push(wallet);
      }

      return {
        currentWalletId: wallet.id,
        wallets,
        generatedTempWalletAddress: null,
        importedTempWalletAddress: null,
        lastRegisteredWallet: isNewWallet ? wallet : null,
        recoverableAccounts: null,
        authEmail: null,
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
    [userId],
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
    }));

    return recoverableAccounts;
  }, [session]);

  const clearRecoverableAccounts = useCallback(() => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts: null,
    }));
  }, []);

  const recoverAccount = useCallback(
    async (authProviderType: AuthProviderType, accountToRecoverId: string) => {
      log(LOG_GROUP.WALLET_GENERATION, `recoverAccount(${authProviderType}, ${accountToRecoverId})`);

      const { jwk, walletAddress } = await importedTempWalletPromiseRef.current?.promise;

      const latestSession = await getLatestSession(session);

      const { accountRecoveryChallenge } = await AuthenticationService.generateAccountRecoveryChallenge(
        accountToRecoverId,
        walletAddress,
      );

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: accountRecoveryChallenge,
        session: latestSession,
        shareHash: null,
        jwk,
      });

      await AuthenticationService.recoverAccount(userId, challengeSolution);
    },
    [session],
  );

  const recoverWallet = useCallback(
    async (recoveryData: RecoveryJSON | JWKInterface | string) => {
      let jwk: JWKInterface;
      let walletAddress: string;
      let walletId: string;
      let recoveryBackupShare: string | null = null;
      let recoveryFileServerSignature: string | null = null;
      let recoveryBackupShareHash: string | null = null;
      let recoveryBackupSharePrivateKeyJWK: JWKInterface | null = null;
      let isRecoveryJSON = true;

      if (WalletUtils.isJWK(recoveryData) || WalletUtils.isSeedPhrase(recoveryData)) {
        const promise = importedTempWalletPromiseRef.current?.promise;
        ({ jwk, walletAddress } = await promise);
        walletId = wallets.find(({ address }) => address === walletAddress)?.id;
        isRecoveryJSON = false;
      } else {
        ({ walletId, recoveryBackupShare, recoveryFileServerSignature } = recoveryData as RecoveryJSON);
        ({ shareHash: recoveryBackupShareHash, sharePrivateKeyJWK: recoveryBackupSharePrivateKeyJWK } =
          await WalletUtils.generateShareHashAndPrivateKey(recoveryBackupShare));
        walletAddress = wallets.find(({ id }) => id === walletId)?.address;
      }

      if (!walletId || !walletAddress) {
        throw new Error("Wallet not found!");
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

      // No longer relying on localStorage for authentication type tracking
      // The auth provider type is already tracked in embeddedContextAuth

      try {
        await addWallet(jwk, wallet);
      } finally {
        freeDecryptedWallet(jwk);
      }
    },
    [session, userId, wallets, walletAddress]
  );

  // AUTHENTICATION:

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

  const authenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      if (user) {
        const supabase = await getSupabaseClient();
        await supabase.auth.refreshSession();
        return;
      }

      try {
        setEmbeddedContextAuth({
          authStatus: "authLoading",
          authProviderType,
          user: null,
          session: null,
        });

        const { url } = await AuthenticationService.authenticate(authProviderType);

        if (url) {
          // Calculate center position for the popup
          const width = 500;
          const height = 600;
          const left = window.screenX + (window.outerWidth - width) / 2;
          const top = window.screenY + (window.outerHeight - height) / 2;

          let popup = window.open(
            url,
            "Auth",
            [
              `width=${width}`,
              `height=${height}`,
              `left=${left}`,
              `top=${top}`,
              "popup=1",
              "location=1",
              "status=1",
              "resizable=no",
              "toolbar=no",
              "menubar=no",
            ].join(","),
          );

          if (!popup) {
            console.error("Popup blocked. Please allow popups for this site.");
            // Redirect to Google's OAuth page
            // Opening the URL on the current tab won't work when Embedded is loaded inside the iframe:

            if (location.ancestorOrigins.length === 0) {
              console.log(`Redirecting to ${url}...`);

              window.location.href = url;
            } else {
              console.log(`Opening ${url}...`);

              popup = window.open(url, "_blank");
            }
          }

          if (popup) {
            try {
              // Set up message listener and popup close checker
              await Promise.race([
                // Auth completion promise
                new Promise<void>((resolve, reject) => {
                  const messageHandler = async (event: MessageEvent) => {
                    // Since same origin, we can check it exactly
                    if (event.origin !== window.location.origin) return;

                    if (event.data?.type === "AUTH_COMPLETE") {
                      console.log("Auth message received:", event.data);
                      cleanup();
                      if (event.data?.success) {
                        const supabase = await getSupabaseClient();
                        if (event.data?.data) {
                          const { data } = event.data;
                          await supabase.auth.refreshSession({
                            refresh_token: data.refresh_token,
                          });
                        } else {
                          await supabase.auth.refreshSession();
                        }

                        resolve();
                      } else {
                        reject(new Error("Authentication failed"));
                      }
                    }
                  };

                  // Check for popup closure
                  const popupCheckInterval = setInterval(() => {
                    if (popup.closed) {
                      cleanup();
                      reject(new Error("Authentication cancelled - popup closed"));
                    }
                  }, 1000);

                  // Timeout after 5 minutes
                  const timeoutId = setTimeout(
                    () => {
                      cleanup();
                      reject(new Error("Authentication timeout"));
                    },
                    5 * 60 * 1000,
                  );

                  // Cleanup function
                  const cleanup = () => {
                    window.removeEventListener("message", messageHandler);
                    clearInterval(popupCheckInterval);
                    clearTimeout(timeoutId);
                  };

                  window.addEventListener("message", messageHandler);
                }),
              ]);
            } catch (error) {
              console.error("Authentication process failed:", error);
            }
          }
        } else {
          console.error("No URL returned from authenticate");
        }
      } catch (error) {
        console.error(`${authProviderType} authentication failed:`, error);
      }
    },
    [user],
  );

  const setAuthEmail = useCallback((email: string) => {
    setEmbeddedContextAuth((prevAuthContextAuth) => ({
      ...prevAuthContextAuth,
      authEmail: email,
    }));
  }, []);

  // INITIALIZATION:

  const lastUserIdRef = useRef<string | null>(null);

  const initEmbeddedWallet = useCallback(async (userId?: string | null, session?: DbSession | null) => {
    if (lastUserIdRef.current === userId) return;

    lastUserIdRef.current = userId;

    setEmbeddedContextState(EMBEDDED_CONTEXT_INITIAL_STATE);

    if (!userId || !session) {
      postEmbeddedMessage({
        type: "embedded_auth",
        data: {
          authType: null,
          authStatus: "not-authenticated",
          userDetails: null,
        },
      });

      generateTempWallet();

      return;
    }

    if (!session.id || !session.deviceNonce) {
      console.warn("❌  The current session is incomplete. Refreshing...", session);
      session = await refreshSession(session);
    } else if (session.deviceNonce !== (await getDeviceNonce())) {
      console.warn("⚠️  The current session is complete, but the device nonce doesn't match!. Refreshing...", session);
      session = await refreshSession(session);
    } else {
      console.log("✅  The current session is complete!", session);
    }

    session = await getLatestSession(session);

    const wallets = await WalletService.fetchWallets(userId);

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      currentWalletId: wallets?.[0]?.id || null,
      wallets,
      session,
    }));

    let authStatus = "noAuth" as AuthStatus;

    if (wallets.length > 0) {
      // If there are wallets, try to activate them
      try {
        // This method handles fetching and activating the wallet regardless of auth method
        const { activatedWallet, rotationChallenge } = await WalletService.fetchFirstAvailableAuthShare(
          wallets,
          session,
          userId,
        );

        if (activatedWallet) {
          const { id: walletId, address: walletAddress } = activatedWallet;

          const jwk = await WalletUtils.generateWalletJWKFromShares(walletAddress, [
            activatedWallet.authShare,
            activatedWallet.deviceShare,
          ]);

          if (rotationChallenge) {
            const { authShare, deviceShare } = await WalletUtils.generateWalletWorkShares(jwk);

            activatedWallet.authShare = authShare;
            activatedWallet.deviceShare = deviceShare;

            const { shareHash: deviceShareHash, sharePublicKey: deviceSharePublicKey } =
              await WalletUtils.generateShareHashAndPublicKey(deviceShare);

            const challengeSolution = await ChallengeClientV1.solveChallenge({
              challenge: rotationChallenge,
              session,
              shareHash: null,
              jwk,
            });

            await WalletService.rotateAuthShare({
              walletId,
              authShare,
              deviceShareHash,
              deviceSharePublicKey,
              challengeSolution,
            });
          }

          await WalletUtils.storeDeviceShare(activatedWallet, userId);

          try {
            await addWallet(jwk, activatedWallet);
            authStatus = "unlocked";
          } finally {
            freeDecryptedWallet(jwk);
          }
        } else {
          authStatus = "noShares";
        }
      } catch (error) {
        console.error("Error activating wallet:", error);
        authStatus = "noShares";
      }
    } else {
      authStatus = "noWallets";
    }

    setEmbeddedContextAuth((prevEmbeddedContextAuth) => ({
      ...prevEmbeddedContextAuth,
      authStatus,
    }));
  }, []);

  const completeAuth = useCallback(async (session: any) => {
    window.opener.postMessage(
      {
        type: "AUTH_COMPLETE",
        success: true,
        data: session,
      },
      window.location.origin,
    );

    // waiting sometime before closing the popup
    await sleep(500);

    log(LOG_GROUP.EMBEDDED_FLOWS, "Closing popup window...");

    // Close the popup after sending the message
    window.close();
  }, []);

  const areBackgroundServicesInitialized = useRef(false);

  useEffect(() => {
    if (areBackgroundServicesInitialized.current) return;

    areBackgroundServicesInitialized.current = true;

    async function init() {
      log(LOG_GROUP.SETUP, `Initializing Wander Embedded background services...`);

      setupBackgroundService();
    }

    init();
  }, []);

  useEffect(() => {
    async function init() {
      /*
      KNOWN AUTHENTICATION ISSUES:

      - The decoded JWT token sometimes is missing some properties (`deviceNonce`). Refreshing the
        sessions seems to fix the issue, but not immediately. The `The current session is incomplete. Refreshing...` block
        in `initEmbeddedWallet` is a dirty/temp fix for that.

      - The `onAuthStateChange` callback below is never invoked when running the app inside an iframe on a different
        origin. The `setTimeout` below is a dirty/tem fix for that.

        See https://stackoverflow.com/questions/71819128/supabase-auth-onauthstatechange-not-working-when-react-app-is-in-iframe

      - When a sessions is deleted from the DB, it's still reported as valid, even thought tRPC endpoints will return
        UNAUTHORIZED errors. When that happens, we should force de-authentication of the frontend.
      */

      // Check for passkey auth data in localStorage immediately on startup
      // This is necessary to restore passkey auth sessions after page reloads
      // We use localStorage as a temporary storage until we can establish a proper auth context
      const customSessionId = localStorage.getItem("sessionId");
      const customUserId = localStorage.getItem("userId");
      const isCustomAuth = localStorage.getItem("isCustomAuth") === "true";

      // If we have passkey auth data, initialize immediately without waiting
      if (isCustomAuth && customSessionId && customUserId) {
        console.log(
          "Found passkey authentication data in localStorage, restoring session"
        );

        try {
          // Get device nonce using the proper utility
          const deviceNonce = await getDeviceNonce();

          // Build a minimal session object for wallet activation
          const dbSession = {
            id: customSessionId,
            userId: customUserId,
            deviceNonce,
            createdAt: new Date(),
            updatedAt: new Date(),
            ip: "127.0.0.1",
            userAgent: navigator.userAgent
          };

          // Request a proper server-signed token using the session ID
          const { access_token } = await AuthenticationService.getSessionToken(
            customSessionId,
            deviceNonce
          );

          if (access_token) {
            setAuthTokenHeader(access_token);
            localStorage.setItem("authToken", access_token);
            console.log("Received server-signed auth token");

            // Create a minimal user object for context
            const customUser = {
              id: customUserId,
              email: null,
              app_metadata: { provider: "passkey", providers: ["passkey"] },
              user_metadata: {},
              aud: "authenticated",
              created_at: ""
            };

            // Set auth context with PASSKEYS auth type
            // This becomes our single source of truth for auth type after initialization
            setEmbeddedContextAuth(({ authStatus }) => ({
              authStatus: "authLoading",
              authProviderType: "PASSKEYS",
              user: customUser as any,
              session: dbSession
            }));

            // Initialize wallet with custom session
            initEmbeddedWallet(customUserId, dbSession);
          } else {
            console.error("Failed to get server-signed token - auth will fail");
            throw new Error("Failed to get server-signed token");
          }
        } catch (error) {
          console.error("Error during passkey authentication setup:", error);
          // Clear possibly corrupted localStorage data
          localStorage.removeItem("isCustomAuth");
          localStorage.removeItem("sessionId");
          localStorage.removeItem("userId");
          // Fall through to normal initialization
        }
      }

      const forceInitTimeoutID = setTimeout(() => {
        console.warn("Forcing initialization...");

        setEmbeddedContextAuth({
          authStatus: "noAuth",
          authProviderType: null,
          user: null,
          session: null
        });

        initEmbeddedWallet();
      }, 2000);

      const supabase = await getSupabaseClient();
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        // console.log("onAuthStateChange =", session);

        window.clearTimeout(forceInitTimeoutID);

        // Comment this line to run Wander Embedded as a standalone page:
        if (!isInsideIframe()) {
          if (session?.access_token && window.opener) {
            await completeAuth(session);
          }

          if (window.location.origin === "https://embed.wander.app") {
            window.close();
            return;
          } else {
            console.warn(
              "In production (https://embed.wander.app), the app would close right now."
            );
          }
        }

        const accessToken = session?.access_token ?? null;
        const user = session?.user ?? null;
        const authProviderType: AuthProviderType | null =
          AUTH_PROVIDER_TYPE_BY_PROVIDER_STR[user?.identities?.[0]?.provider] ||
          null;

        let dbSession: DbSession | null = null;

        if (accessToken) {
          const {
            sub,
            session_id: sessionId,
            sessionData
          } = jwtDecode<SupabaseJwtPayload>(accessToken);

          dbSession = {
            ...sessionData,
            id: sessionId,
            userId: sub
          };
        }

        setAuthTokenHeader(accessToken);

        // Check for passkey authentication with our custom session
        const needsWalletActivation =
          localStorage.getItem("needsWalletActivation") === "true";
        const customSessionId = localStorage.getItem("sessionId");
        const customUserId = localStorage.getItem("userId");
        const isCustomAuth = localStorage.getItem("isCustomAuth") === "true";

        // Create a local variable for auth provider type
        let effectiveAuthProviderType: AuthProviderType | null =
          authProviderType;

        // If we have passkey auth with custom session, set it up
        // The first condition checks if we've determined this is passkey auth from the auth provider
        // OR if we have the isCustomAuth flag in localStorage (for backward compatibility)
        if (
          ((authProviderType === "PASSKEYS" || needsWalletActivation || isCustomAuth) &&
          customSessionId &&
          customUserId &&
          !dbSession)
        ) {
          console.log("Detected passkey authentication with custom session");

          try {
            // Get device nonce using the proper utility
            const deviceNonce = await getDeviceNonce();

            // Clear the flag since we're handling it now
            localStorage.removeItem("needsWalletActivation");

            // Build a minimal session object for wallet activation
            const customDbSession = {
              id: customSessionId,
              userId: customUserId,
              deviceNonce,
              createdAt: new Date(),
              updatedAt: new Date(),
              ip: "127.0.0.1",
              userAgent: navigator.userAgent
            };

            // Request a proper server-signed token
            const { access_token } =
              await AuthenticationService.getSessionToken(
                customSessionId,
                deviceNonce
              );

            if (access_token) {
              setAuthTokenHeader(access_token);
              
              // Store auth data in localStorage to handle page reloads
              // This is used as a fallback mechanism only
              localStorage.setItem("authToken", access_token);
              localStorage.setItem("isCustomAuth", "true");
              console.log("Received server-signed auth token for API requests");

              // Use this session for initialization
              dbSession = customDbSession;

              // Set auth provider type to PASSKEYS for custom passkey auth
              effectiveAuthProviderType = "PASSKEYS";
            } else {
              console.error(
                "Failed to get server-signed token - auth will fail"
              );
            }
          } catch (error) {
            console.error("Error requesting server authentication:", error);
          }
        }

        initEmbeddedWallet(user?.id || customUserId || null, dbSession);

        if (user && dbSession) {
          setEmbeddedContextAuth(({ authStatus }) => ({
            authStatus:
              authStatus === "unknown" || authStatus === "authError"
                ? "authLoading"
                : authStatus,
            authProviderType: effectiveAuthProviderType,
            user,
            session: dbSession
          }));
        } else if (customUserId && dbSession) {
          // Handle custom passkey auth session
          const customUser = {
            id: customUserId,
            email: null,
            // Add required User properties with default values
            app_metadata: {},
            user_metadata: {},
            aud: "",
            created_at: ""
          };

          setEmbeddedContextAuth(({ authStatus }) => ({
            authStatus:
              authStatus === "unknown" || authStatus === "authError"
                ? "authLoading"
                : authStatus,
            authProviderType: "PASSKEYS", // Explicitly set to PASSKEYS for custom auth
            user: customUser as any, // Cast to any to satisfy TypeScript
            session: dbSession
          }));
        } else {
          setEmbeddedContextState(EMBEDDED_CONTEXT_INITIAL_STATE);

          setEmbeddedContextAuth({
            authStatus: "noAuth",
            authProviderType: null,
            user: null,
            session: null,
          });
        }
      });

      return () => {
        window.clearTimeout(forceInitTimeoutID);
        subscription.unsubscribe();
      };
    }

    init();
  }, [initEmbeddedWallet, completeAuth]);

  useEffect(() => {
    if (wocation.startsWith("/access_token") && window.opener) {
      // Get the hash fragment without the leading '#'
      const hashParams = window.location.hash.substring(1);
      // Create URLSearchParams from the hash fragment
      const params = new URLSearchParams(hashParams);
      const searchParams = Object.fromEntries(params.entries());

      // We have completeAuth() in the onAuthStateChange callback, but if it didn't work,
      // we'll use a timeout to call it after a delay.
      setTimeout(() => {
        completeAuth(searchParams);
      }, 5000);
    }
  }, [wocation, completeAuth]);

  return (
    <EmbeddedContext.Provider
      value={{
        ...embeddedContextState,
        ...embeddedContextAuth,

        currentWallet,

        authenticate,
        fetchRecoverableAccounts,
        clearRecoverableAccounts,
        recoverAccount,
        recoverWallet,

        setAuthEmail,

        generateTempWallet,
        deleteGeneratedTempWallet,

        importTempWallet,
        deleteImportedTempWallet,

        registerWallet,
        clearLastRegisteredWallet,
        skipBackUp,
        downloadKeyfile,
        copySeedphrase,
        getSeedphrase,
        generateRecoveryAndDownload,
      }}>
      {children}
    </EmbeddedContext.Provider>
  );
}
