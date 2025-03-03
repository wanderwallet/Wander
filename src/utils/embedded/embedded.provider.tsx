import type { JWKInterface } from "arweave/web/lib/wallet";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { setupBackgroundService } from "~api/background/background-setup";
import { WalletService } from "~utils/wallets/wallets.service";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { getKeyfile, getWallets, type LocalWallet } from "~wallets";
import Arweave from "arweave";
import { defaultGateway } from "~gateways/gateway";
import { freeDecryptedWallet } from "~wallets/encryption";
import {
  downloadKeyfile as downloadKeyfileUtil,
  downloadRecoveryFile
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
  Wallet
} from "~utils/embedded/embedded.types";
import {
  isTempWalletPromiseExpired,
  setAuthTokenHeader,
  supabase,
  trpcVanilla
} from "~utils/embedded/embedded.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  AuthProviderType,
  ChallengeClientV1,
  WalletSourceType,
  type DbSession
} from "embed-api";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import {
  AUTH_PROVIDER_TYPE_BY_PROVIDER_STR,
  EMBEDDED_FEATURE_FLAGS
} from "~utils/embedded/embedded.constants";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";
import { jwtDecode } from "jwt-decode";
import type { SupabaseJwtPayload } from "~utils/authentication/authentication.types";

export type AuthStatusCopy = AuthStatus;

const EMBEDDED_CONTEXT_INITIAL_STATE = {
  currentWalletId: "",
  wallets: [],
  generatedTempWalletAddress: null,
  importedTempWalletAddress: null,
  lastRegisteredWallet: null,
  recoverableAccounts: null
} as const satisfies EmbeddedContextState;

const EMBEDDED_CONTEXT_INITIAL_AUTH = {
  authStatus: "unknown",
  authProviderType: null,
  user: null,
  session: null
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
  generateRecoveryAndDownload: async () => null
});

export function EmbeddedProvider({ children }: EmbeddedProviderProps) {
  const [embeddedContextState, setEmbeddedContextState] =
    useState<EmbeddedContextState>(EMBEDDED_CONTEXT_INITIAL_STATE);

  const [embeddedContextAuth, setEmbeddedContextAuth] =
    useState<EmbeddedContextAuth>(EMBEDDED_CONTEXT_INITIAL_AUTH);

  // Wallet props:

  const { currentWalletId: walletId, wallets } = embeddedContextState;

  const currentWallet = useMemo(() => {
    return (
      wallets.find((wallet) => {
        return wallet.id === walletId;
      }) || null
    );
  }, [wallets, walletId]);

  console.log("currentWallet =", currentWallet);

  const walletAddress = currentWallet?.address;

  // Auth props:

  const { authStatus, user, session } = embeddedContextAuth;

  const userId = user?.id || null;

  useEffect(() => {
    if (authStatus !== "unknown") {
      const coverElement = document.getElementById("cover");

      coverElement.setAttribute("aria-hidden", "true");
    }
  }, [authStatus]);

  const updateCurrentWallet = useCallback(
    (walletUpdater: Wallet | ((currentWallet: Wallet) => Wallet)) => {
      setEmbeddedContextState((prevEmbeddedContextState) => {
        const currentWalletIndex = prevEmbeddedContextState.wallets.findIndex(
          (wallet) => {
            return wallet.id === prevEmbeddedContextState.currentWalletId;
          }
        );

        const currentWallet =
          prevEmbeddedContextState.wallets[currentWalletIndex];

        if (!currentWallet)
          throw new Error(
            `No wallet with ID = "${prevEmbeddedContextState.currentWalletId}" found.`
          );

        const wallets = [...prevEmbeddedContextState.wallets];

        wallets[currentWalletIndex] =
          typeof walletUpdater === "object"
            ? walletUpdater
            : walletUpdater(currentWallet);

        return {
          ...prevEmbeddedContextState,
          wallets
        };
      });
    },
    []
  );

  const skipBackUp = useCallback(
    async (doNotAskAgainSetting: boolean) => {
      log(LOG_GROUP.EMBEDDED_FLOWS, `skipBackUp(${doNotAskAgainSetting})`);

      // TODO: Persist lastPromptData locally too?

      if (doNotAskAgainSetting) {
        const { wallet: updatedWallet } =
          await WalletService.doNotAskAgainForBackup({
            walletId
          });

        updateCurrentWallet((currentWallet) => ({
          ...currentWallet,
          ...updatedWallet
        }));
      } else {
        updateCurrentWallet((currentWallet) => ({
          ...currentWallet,
          doNotAskAgainSetting: true
        }));
      }
    },
    [walletId, updateCurrentWallet]
  );

  const downloadKeyfile = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `downloadKeyfile()`);

    // TODO: Add an option to encrypt with a password

    const decryptedWallet = (await getKeyfile(
      walletAddress
    )) as LocalWallet<JWKInterface>;

    downloadKeyfileUtil(walletAddress, decryptedWallet.keyfile);

    // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
    freeDecryptedWallet(decryptedWallet.keyfile);

    const { wallet: updatedWallet } = await WalletService.registerWalletExport({
      walletId,
      type: "KEYFILE"
    });

    // TODO: Update wallet in state for all calls that return an updated wallet.

    updateCurrentWallet((currentWallet) => ({
      ...currentWallet,
      ...updatedWallet
    }));
  }, [walletId, walletAddress, updateCurrentWallet]);

  const copySeedphrase = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `copySeedphrase()`);

    const decryptedWallet = (await getKeyfile(
      walletAddress
    )) as LocalWallet<JWKInterface>;

    const jwk = decryptedWallet.keyfile;

    const seedPhrase = await WalletUtils.getDecryptedSeedPhrase(walletId, jwk);

    await navigator.clipboard.writeText(seedPhrase);

    const { wallet: updatedWallet } = await WalletService.registerWalletExport({
      walletId,
      type: "SEEDPHRASE"
    });

    updateCurrentWallet((currentWallet) => ({
      ...currentWallet,
      ...updatedWallet
    }));
  }, [walletId, updateCurrentWallet]);

  const generateRecoveryAndDownload = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `generateRecoveryAndDownload()`);

    const decryptedWallet = (await getKeyfile(
      walletAddress
    )) as LocalWallet<JWKInterface>;

    const jwk = decryptedWallet.keyfile;

    const { recoveryAuthShare, recoveryBackupShare } =
      await WalletUtils.generateWalletRecoveryShares(jwk);

    const {
      shareHash: recoveryBackupShareHash,
      sharePublicKey: recoveryBackupSharePublicKey
    } = await WalletUtils.generateShareHashAndPublicKey(recoveryBackupShare);

    const deviceNonce = getDeviceNonce();

    const registerRecoveryShareResponse =
      await WalletService.registerRecoveryShare({
        walletId,
        recoveryAuthShare,
        recoveryBackupShareHash,
        recoveryBackupSharePublicKey
      });

    downloadRecoveryFile(walletAddress, {
      walletId,
      recoveryBackupShare,
      recoveryFileServerSignature:
        registerRecoveryShareResponse.recoveryFileServerSignature
    });

    // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
    freeDecryptedWallet(jwk);
  }, [walletId, walletAddress]);

  // TODO: Need to observe storage to keep track of new wallets, removed wallets or active wallet changes... Or just
  // migrate wallet management to Mobx altogether for both extensions...

  const addWallet = useCallback(
    async (jwk: JWKInterface, wallet: Wallet, isNewWallet = false) => {
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
          recoverableAccounts: null
        } satisfies EmbeddedContextState;
      });

      setEmbeddedContextAuth((prevEmbeddedContextAuth) => ({
        ...prevEmbeddedContextAuth,
        authStatus: "unlocked"
      }));
    },
    []
  );

  // GENERATE WALLET:

  const generatedTempWalletPromiseRef = useRef<null | TempWalletPromise>(null);

  const deleteGeneratedTempWallet = useCallback(async () => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      generatedTempWalletAddress: null
    }));

    const generatedTempWalletPromise = generatedTempWalletPromiseRef.current;

    if (generatedTempWalletPromise) {
      generatedTempWalletPromise.controller.abort();

      const tempWallet = await Promise.race([
        generatedTempWalletPromise.promise,
        sleep(1)
      ]);

      if (tempWallet) {
        log(LOG_GROUP.WALLET_GENERATION, `deleteGeneratedTempWallet()`);

        freeDecryptedWallet(tempWallet.jwk);
      }
    }

    generatedTempWalletPromiseRef.current = null;
  }, []);

  const generateTempWallet = useCallback(() => {
    const generatedTempWalletPromise = generatedTempWalletPromiseRef.current;

    if (
      generatedTempWalletPromise &&
      !isTempWalletPromiseExpired(generatedTempWalletPromise)
    ) {
      return generatedTempWalletPromise.promise;
    }

    deleteGeneratedTempWallet();

    log(LOG_GROUP.WALLET_GENERATION, `generateTempWallet()`);

    const controller = new AbortController();
    const { signal } = controller;

    const promise: Promise<TempWallet> = new Promise(
      async (resolve, reject) => {
        signal.addEventListener("abort", reject);

        const seedPhrase = await WalletUtils.generateSeedPhrase();
        const jwk = await WalletUtils.generateWalletJWK(seedPhrase);
        const arweave = new Arweave(defaultGateway);
        const walletAddress = await arweave.wallets.jwkToAddress(jwk);

        setEmbeddedContextState((prevAuthContextState) => ({
          ...prevAuthContextState,
          generatedTempWalletAddress: walletAddress
        }));

        resolve({
          seedPhrase,
          jwk,
          walletAddress
        });

        signal.removeEventListener("abort", reject);
      }
    );

    generatedTempWalletPromiseRef.current = {
      createdAt: Date.now(),
      promise,
      controller
    };

    return promise;
  }, []);

  // IMPORT WALLET:

  const importedTempWalletPromiseRef = useRef<null | TempWalletPromise>();

  // This function is called in the import views when users don't confirm the import or when they leave the screen:

  const deleteImportedTempWallet = useCallback(async () => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      importedTempWalletAddress: null
    }));

    const importedTempWalletPromise = importedTempWalletPromiseRef.current;

    if (importedTempWalletPromise) {
      importedTempWalletPromise.controller.abort();

      const tempWallet = await Promise.race([
        importedTempWalletPromise.promise,
        sleep(1)
      ]);

      if (tempWallet) {
        log(LOG_GROUP.WALLET_GENERATION, `deleteImportedTempWallet()`);

        freeDecryptedWallet(tempWallet.jwk);
      }
    }

    importedTempWalletPromiseRef.current = null;
  }, []);

  const importTempWallet = useCallback(
    async (jwkOrSeedPhrase: JWKInterface | string) => {
      await deleteImportedTempWallet();

      log(LOG_GROUP.WALLET_GENERATION, `importTempWallet()`);

      const controller = new AbortController();
      const { signal } = controller;

      const promise: Promise<TempWallet> = new Promise(
        async (resolve, reject) => {
          signal.addEventListener("abort", reject);

          const importedSeedPhrase: string | null =
            typeof jwkOrSeedPhrase === "string" ? jwkOrSeedPhrase : null;
          const importedJWK: JWKInterface | null =
            typeof jwkOrSeedPhrase === "string" ? null : jwkOrSeedPhrase;
          const jwk =
            importedJWK ||
            (await WalletUtils.generateWalletJWK(importedSeedPhrase));
          const arweave = new Arweave(defaultGateway);
          const walletAddress = await arweave.wallets.jwkToAddress(jwk);

          setEmbeddedContextState((prevAuthContextState) => ({
            ...prevAuthContextState,
            importedTempWalletAddress: walletAddress
          }));

          resolve({
            seedPhrase: importedSeedPhrase,
            jwk,
            walletAddress
          });

          signal.removeEventListener("abort", reject);
        }
      );

      importedTempWalletPromiseRef.current = {
        createdAt: Date.now(),
        promise,
        controller
      };

      return promise;
    },
    []
  );

  // REGISTER WALLET:

  const registerWallet = useCallback(
    async (sourceType: WalletSourceType) => {
      log(LOG_GROUP.WALLET_GENERATION, `registerWallet(${sourceType})`);

      const promise =
        sourceType === "GENERATED"
          ? generatedTempWalletPromiseRef.current?.promise
          : importedTempWalletPromiseRef.current?.promise;

      const { seedPhrase, jwk, walletAddress } = await promise;

      const { authShare, deviceShare } =
        await WalletUtils.generateWalletWorkShares(jwk);

      const {
        shareHash: deviceShareHash,
        sharePublicKey: deviceSharePublicKey
      } = await WalletUtils.generateShareHashAndPublicKey(deviceShare);

      const createWalletResponse = await WalletService.createPublicWallet({
        address: walletAddress,
        publicKey: jwk.n,
        authShare,
        deviceShareHash,
        deviceSharePublicKey,
        source: {
          type: sourceType,
          from: seedPhrase ? "SEEDPHRASE" : "KEYFILE"
        }
      });

      const dbWallet = createWalletResponse.wallet;

      const wallet: Wallet = {
        ...dbWallet,
        activationStatus: "active",
        authShare,
        deviceShare
      };

      WalletUtils.storeDeviceShare(wallet, userId);

      if (seedPhrase && EMBEDDED_FEATURE_FLAGS.STORE_SEED_PHRASE) {
        WalletUtils.storeEncryptedSeedPhrase(dbWallet.id, seedPhrase, jwk);
      }

      try {
        await addWallet(jwk, wallet, true);
      } finally {
        freeDecryptedWallet(jwk);
      }

      return dbWallet;
    },
    [userId]
  );

  const clearLastRegisteredWallet = useCallback(() => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      lastRegisteredWallet: null
    }));
  }, []);

  // ACCOUNT RECOVERY:

  const fetchRecoverableAccounts = useCallback(async () => {
    log(LOG_GROUP.WALLET_GENERATION, `fetchRecoverableAccounts()`);

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts: null
    }));

    const { jwk, walletAddress } = await importedTempWalletPromiseRef.current
      ?.promise;

    const { fetchRecoverableWalletsChallenge } =
      await AuthenticationService.generateFetchRecoverableAccountsChallenge(
        walletAddress
      );

    const challengeSolution = await ChallengeClientV1.solveChallenge({
      challenge: fetchRecoverableWalletsChallenge,
      session,
      shareHash: null,
      jwk
    });

    const { recoverableAccounts } =
      await AuthenticationService.fetchRecoverableAccounts(
        fetchRecoverableWalletsChallenge.id,
        challengeSolution
      );

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts
    }));

    return recoverableAccounts;
  }, [session]);

  const clearRecoverableAccounts = useCallback(() => {
    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      recoverableAccounts: null
    }));
  }, []);

  const recoverAccount = useCallback(
    async (authProviderType: AuthProviderType, accountToRecoverId: string) => {
      log(
        LOG_GROUP.WALLET_GENERATION,
        `recoverAccount(${authProviderType}, ${accountToRecoverId})`
      );

      const { jwk, walletAddress } = await importedTempWalletPromiseRef.current
        ?.promise;

      const { accountRecoveryChallenge } =
        await AuthenticationService.generateAccountRecoveryChallenge(
          accountToRecoverId,
          walletAddress
        );

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: accountRecoveryChallenge,
        session,
        shareHash: null,
        jwk
      });

      await AuthenticationService.recoverAccount(userId, challengeSolution);

      // TODO: The imported wallet needs to be split and the authShare sent to the backend. Then, wallets need to be
      // fetched...
    },
    [session]
  );

  const recoverWallet = useCallback(
    async (recoveryData: RecoveryJSON | JWKInterface | string) => {
      if (
        typeof recoveryData === "string" ||
        recoveryData.hasOwnProperty("kty")
      ) {
        throw new Error("Keyfile sand seedphrases not supported yet.");
      }

      const {
        version,
        walletId,
        recoveryBackupShare,
        recoveryFileServerSignature
      } = recoveryData as RecoveryJSON;

      const {
        shareHash: recoveryBackupShareHash,
        sharePrivateKeyJWK: recoveryBackupSharePrivateKeyJWK
      } = await WalletUtils.generateShareHashAndPrivateKey(recoveryBackupShare);

      const { shareRecoveryChallenge } =
        await WalletService.generateWalletRecoveryChallenge({ walletId });

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: shareRecoveryChallenge,
        session,
        shareHash: recoveryBackupShareHash,
        jwk: recoveryBackupSharePrivateKeyJWK
      });

      const authRecoveryShareResponse = await WalletService.recoverWallet({
        walletId,
        recoveryBackupShareHash,
        recoveryFileServerSignature,
        challengeSolution
      });

      if (!("recoveryAuthShare" in authRecoveryShareResponse)) {
        throw new Error("Recovery share not found.");

        // TODO: Validate file signature and show a proper error message...
      }

      const { recoveryAuthShare, rotationChallenge } =
        authRecoveryShareResponse;

      const jwk = await WalletUtils.generateWalletJWKFromShares(walletAddress, [
        recoveryAuthShare,
        recoveryBackupShare
      ]);

      const { authShare, deviceShare } =
        await WalletUtils.generateWalletWorkShares(jwk);

      const rotateChallengeSignature = await ChallengeClientV1.solveChallenge({
        challenge: rotationChallenge,
        session,
        shareHash: null,
        jwk
      });

      const {
        shareHash: deviceShareHash,
        sharePublicKey: deviceSharePublicKey
      } = await WalletUtils.generateShareHashAndPublicKey(deviceShare);

      const registerAuthShareResponse = await WalletService.registerAuthShare({
        walletId,
        authShare,
        deviceShareHash,
        deviceSharePublicKey,
        challengeSolution: rotateChallengeSignature
      });

      const dbWallet = registerAuthShareResponse.wallet;

      const wallet: Wallet = {
        ...dbWallet,
        activationStatus: "active",
        authShare,
        deviceShare
      };

      WalletUtils.storeDeviceShare(wallet, userId);

      try {
        await addWallet(jwk, wallet);
      } finally {
        freeDecryptedWallet(jwk);
      }
    },
    [session, userId, wallets]
  );

  // AUTHENTICATION:

  const authenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      if (user) {
        // TODO: What to do if this is called while already authenticated?
        await supabase.auth.refreshSession();

        return;
      }

      // TODO: Handle errors and authentication redirects here:
      try {
        // setIsLoading(true);

        const { url } = await AuthenticationService.authenticate(
          authProviderType
        );

        if (url) {
          // Redirect to Google's OAuth page
          window.location.href = url;
        } else {
          console.error("No URL returned from authenticate");
        }
      } catch (error) {
        console.error("Google sign-in failed:", error);
        // setIsLoading(false);
      }
    },
    [user]
  );

  // INITIALIZATION:

  const lastUserIdRef = useRef<string | null>(null);

  const initEmbeddedWallet = useCallback(
    async (userId: string | null, session: DbSession | null) => {
      if (lastUserIdRef.current === userId) return;

      lastUserIdRef.current = userId;

      console.log(`initEmbeddedWallet(${userId})`);

      setEmbeddedContextState(EMBEDDED_CONTEXT_INITIAL_STATE);

      if (!userId || !session) {
        generateTempWallet();

        return;
      }

      const wallets = await WalletService.fetchWallets(userId);

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        currentWalletId: wallets?.[0]?.id || null,
        wallets
      }));

      let authStatus = "noAuth" as AuthStatus;

      if (wallets.length > 0) {
        // TODO: The wallet activation can be deferred until the wallet is going to be used:

        // TODO: If we think the wallets are lost, we just show a different screen like the "add wallet"
        // one but with a different message.

        // TODO: Create an issue for the new storage needs (e.g. expiration). Note that for wallets
        // that haven't been backup up, we must never delete a share without notifying the user.

        // TODO: Add try-catch. If the initialization process fails, show an error...

        const { activatedWallet, rotationChallenge } =
          await WalletService.fetchFirstAvailableAuthShare(wallets, session);

        if (activatedWallet) {
          const { id: walletId, address: walletAddress } = activatedWallet;

          const jwk = await WalletUtils.generateWalletJWKFromShares(
            walletAddress,
            [activatedWallet.authShare, activatedWallet.deviceShare]
          );

          if (rotationChallenge) {
            const { authShare, deviceShare } =
              await WalletUtils.generateWalletWorkShares(jwk);

            activatedWallet.authShare = authShare;
            activatedWallet.deviceShare = deviceShare;

            const {
              shareHash: deviceShareHash,
              sharePublicKey: deviceSharePublicKey
            } = await WalletUtils.generateShareHashAndPublicKey(deviceShare);

            const challengeSolution = await ChallengeClientV1.solveChallenge({
              challenge: rotationChallenge,
              session,
              shareHash: null,
              jwk
            });

            await WalletService.rotateAuthShare({
              walletId,
              authShare,
              deviceShareHash,
              deviceSharePublicKey,
              challengeSolution
            });
          }

          WalletUtils.storeDeviceShare(activatedWallet, userId);

          try {
            await addWallet(jwk, activatedWallet);
          } finally {
            freeDecryptedWallet(jwk);
          }

          authStatus = "unlocked";
        } else {
          authStatus = "noShares";
        }
      } else {
        authStatus = "noWallets";
      }

      setEmbeddedContextAuth((prevEmbeddedContextAuth) => ({
        ...prevEmbeddedContextAuth,
        authStatus
      }));
    },
    []
  );

  const areBackgroundServicesInitialized = useRef(false);

  useEffect(() => {
    if (areBackgroundServicesInitialized.current) return;

    areBackgroundServicesInitialized.current = true;

    async function init() {
      log(
        LOG_GROUP.SETUP,
        `Initializing Wander Embedded background services...`
      );

      setupBackgroundService();
    }

    init();
  }, []);

  useEffect(() => {
    console.log("Listening for onAuthStateChange()...");

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("onAuthStateChange =", session);

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

      // TODO: Why is the session still reported as valid after deleting it from the DB?
      // TODO: Make sure any tRPC call returning UNAUTHORIZED forces de-authentication.

      // setToken(accessToken);
      setAuthTokenHeader(accessToken);

      initEmbeddedWallet(user?.id || null, dbSession);

      if (accessToken && user && authProviderType) {
        setEmbeddedContextAuth(({ authStatus }) => ({
          authStatus:
            authStatus === "unknown" || authStatus === "authError"
              ? "authLoading"
              : authStatus,
          authProviderType,
          user,
          session: dbSession
        }));
      } else {
        setEmbeddedContextState(EMBEDDED_CONTEXT_INITIAL_STATE);

        setEmbeddedContextAuth({
          authStatus: "noAuth",
          authProviderType: null,
          user: null,
          session: null
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [initEmbeddedWallet]);

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

        generateTempWallet,
        deleteGeneratedTempWallet,

        importTempWallet,
        deleteImportedTempWallet,

        registerWallet,
        clearLastRegisteredWallet,

        skipBackUp,
        downloadKeyfile,
        copySeedphrase,
        generateRecoveryAndDownload
      }}
    >
      {children}
    </EmbeddedContext.Provider>
  );
}
