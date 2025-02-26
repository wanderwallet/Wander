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
  WalletInfo,
  TempWallet,
  AuthStatus,
  TempWalletPromise,
  RecoveryJSON
} from "~utils/embedded/embedded.types";
import { isTempWalletPromiseExpired } from "~utils/embedded/embedded.utils";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import {
  ChallengeClientV1,
  WalletSourceFrom,
  WalletSourceType,
  type AuthProviderType,
  type DbWallet,
  ExportType
} from "embed-api";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import {
  EMBEDDED_FEATURE_FLAGS,
  EMPTY_SESSION
} from "~utils/embedded/embedded.constants";
import { getDeviceNonce } from "~utils/embedded/device-nonce/device-nonce.utils";

export type AuthStatusCopy = AuthStatus;

const EMBEDDED_CONTEXT_INITIAL_STATE: EmbeddedContextState = {
  // AuthenticatioN:
  authStatus: "unknown",
  authProviderType: null,
  user: null,

  // Wallets:
  currentWalletId: "",
  wallets: [],
  generatedTempWalletAddress: null,
  importedTempWalletAddress: null,
  lastRegisteredWallet: null,
  recoverableAccounts: null
};

export const EmbeddedContext = createContext<EmbeddedContextData>({
  ...EMBEDDED_CONTEXT_INITIAL_STATE,

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

  const {
    authStatus,
    user,
    currentWalletId: walletId,
    wallets
  } = embeddedContextState;

  const currentWallet = useMemo(() => {
    return (
      wallets.find((wallet) => {
        return wallet.id === walletId;
      }) || null
    );
  }, [wallets, walletId]);

  const userId = user?.id || null;
  const walletAddress = currentWallet.id;

  useEffect(() => {
    if (authStatus !== "unknown") {
      const coverElement = document.getElementById("cover");

      coverElement.setAttribute("aria-hidden", "true");
    }
  }, [authStatus]);

  const updateCurrentWallet = useCallback(
    (
      walletInfoUpdater:
        | WalletInfo
        | ((prevCurrentWalletInfo: WalletInfo) => WalletInfo)
    ) => {
      setEmbeddedContextState((prevAuthContextState) => {
        const currentWalletIndex = prevAuthContextState.wallets.findIndex(
          (wallet) => {
            return wallet.id === prevAuthContextState.currentWalletId;
          }
        );

        const currentWallet = prevAuthContextState.wallets[currentWalletIndex];

        if (!currentWallet)
          throw new Error(
            `No wallet with ID = "${prevAuthContextState.currentWalletId}" found.`
          );

        const wallets = [...prevAuthContextState.wallets];

        wallets[currentWalletIndex] =
          typeof walletInfoUpdater === "object"
            ? walletInfoUpdater
            : walletInfoUpdater(currentWallet);

        return {
          ...prevAuthContextState,
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

        const updatedWalletInfo: WalletInfo = {
          ...updatedWallet,
          isActive: true,
          isReady: true
        };

        updateCurrentWallet(updatedWalletInfo);
      } else {
        updateCurrentWallet((prevCurrentWalletInfo) => ({
          ...prevCurrentWalletInfo,
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
      type: ExportType.KEYFILE
    });

    const updatedWalletInfo: WalletInfo = {
      ...updatedWallet,
      isActive: true,
      isReady: true
    };

    updateCurrentWallet(updatedWalletInfo);
  }, [walletId, walletAddress, updateCurrentWallet]);

  const copySeedphrase = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `copySeedphrase()`);

    const seedPhrase = WalletUtils.getDecryptedSeedPhrase(
      walletId,
      // TODO: Generate and pass JWK:
      {} as any
    );

    await navigator.clipboard.writeText(seedPhrase);

    const { wallet: updatedWallet } = await WalletService.registerWalletExport({
      walletId,
      type: ExportType.SEEDPHRASE
    });

    const updatedWalletInfo: WalletInfo = {
      ...updatedWallet,
      isActive: true,
      isReady: true
    };

    updateCurrentWallet(updatedWalletInfo);
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
    async (jwk: JWKInterface, dbWallet: DbWallet, isNewWallet = false) => {
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
        const nextWallets = [...prevWallets];

        if (
          !nextWallets.find(
            (prevWallet) => prevWallet.address === dbWallet.address
          )
        ) {
          nextWallets.push({
            ...dbWallet,
            isActive: false,
            isReady: true
          } satisfies WalletInfo);
        }

        return {
          // TODO: Why EMBEDDED_CONTEXT_INITIAL_STATE here and not prevState?
          ...EMBEDDED_CONTEXT_INITIAL_STATE,
          authStatus: "unlocked",
          wallets: nextWallets,
          lastRegisteredWallet: isNewWallet ? dbWallet : null
        };
      });
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
        sourceType === WalletSourceType.GENERATED
          ? generatedTempWalletPromiseRef.current?.promise
          : importedTempWalletPromiseRef.current?.promise;

      const { seedPhrase, jwk, walletAddress } = await promise;

      const { authShare, deviceShare } =
        await WalletUtils.generateWalletWorkShares(jwk);

      const {
        shareHash: deviceShareHash,
        sharePublicKey: deviceSharePublicKey
      } = await WalletUtils.generateShareHashAndPublicKey(deviceShare);

      const deviceNonce = getDeviceNonce();

      const createWalletResponse = await WalletService.createPublicWallet({
        address: walletAddress,
        publicKey: jwk.n,
        authShare,
        deviceShareHash,
        deviceSharePublicKey,
        source: {
          type: sourceType,
          from: seedPhrase
            ? WalletSourceFrom.SEEDPHRASE
            : WalletSourceFrom.KEYFILE
        }
      });

      const dbWallet = createWalletResponse.wallet;

      WalletUtils.storeDeviceShare(dbWallet.id, deviceShare, userId);

      // TODO: This flag must be checked on launch and the stored seedphrase should be removed if the flag becomes false.
      if (seedPhrase && EMBEDDED_FEATURE_FLAGS.STORE_SEED_PHRASE) {
        WalletUtils.storeEncryptedSeedPhrase(dbWallet.id, seedPhrase, jwk);
      }

      try {
        await addWallet(jwk, dbWallet, true);
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
      session: EMPTY_SESSION,
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
  }, []);

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
        session: EMPTY_SESSION,
        shareHash: null,
        jwk
      });

      await AuthenticationService.recoverAccount(userId, challengeSolution);

      // TODO: The imported wallet needs to be split and the authShare sent to the backend. Then, wallets need to be
      // fetched...
    },
    []
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

      const { shareRecoveryChallenge } =
        await WalletService.generateWalletRecoveryChallenge({ walletId });

      const {
        shareHash: recoveryBackupShareHash,
        sharePrivateKeyJWK: recoveryBackupSharePrivateKeyJWK
      } = await WalletUtils.generateShareHashAndPrivateKey(recoveryBackupShare);

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: shareRecoveryChallenge,
        session: EMPTY_SESSION,
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
        session: EMPTY_SESSION,
        shareHash: null,
        jwk
      });

      const {
        shareHash: deviceShareHash,
        sharePublicKey: deviceSharePublicKey
      } = await WalletUtils.generateShareHashAndPublicKey(deviceShare);

      await WalletService.registerAuthShare({
        walletId,
        authShare,
        deviceShareHash,
        deviceSharePublicKey,
        challengeSolution: rotateChallengeSignature
      });

      WalletUtils.storeDeviceShare(walletId, deviceShare, userId);

      const dbWallet = wallets.find((dbWallet) => {
        return dbWallet.address === walletAddress;
      });

      try {
        await addWallet(jwk, dbWallet);
      } finally {
        freeDecryptedWallet(jwk);
      }
    },
    [userId, wallets]
  );

  // INITIALIZATION:

  const initEmbeddedWallet = useCallback(
    async (authProviderType?: AuthProviderType) => {
      setEmbeddedContextState({
        ...EMBEDDED_CONTEXT_INITIAL_STATE,
        authStatus: "authLoading",
        authProviderType
      });

      // TODO: Handle errors and authentication redirects here:

      const authentication = authProviderType
        ? await AuthenticationService.authenticate(authProviderType)
        : await AuthenticationService.refreshSession();

      const userId = authentication?.userId || null;

      if (!userId) {
        generateTempWallet();

        setEmbeddedContextState((prevAuthContextState) => ({
          ...prevAuthContextState,
          authStatus: "noAuth"
        }));

        return;
      }

      const dbWallets = await WalletService.fetchWallets();

      const wallets = dbWallets.map(
        (dbWallet) =>
          ({
            ...dbWallet,
            isActive: false,
            isReady: false
          } satisfies WalletInfo)
      );

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        wallets
      }));

      let authStatus = "noAuth" as AuthStatus;

      if (wallets.length > 0) {
        // TODO: The wallet activation can be deferred until the wallet is going to be used:

        // TODO: TODO: We need to keep track of the last used one, not the last created one:
        const deviceSharesInfo = WalletUtils.getDeviceSharesInfo(userId);

        // TODO: Verify if wallets match between dbWallets and deviceSharesInfo before
        // calling fetchFirstAvailableAuthShare().

        // TODO: If we think the wallets are lost, we just show a different screen like the "add wallet"
        // one but with a different message.

        // TODO: Create an issue for the new storage needs (e.g. expiration). Note that for wallets
        // that haven't been backup up, we must never delete a share without notifying the user.

        if (deviceSharesInfo.length > 0) {
          const authShareResponse =
            await WalletService.fetchFirstAvailableAuthShare(deviceSharesInfo);

          if (authShareResponse) {
            const jwk = await WalletUtils.generateWalletJWKFromShares(
              walletAddress,
              [authShareResponse.authShare, authShareResponse.deviceShare]
            );

            const { walletId, rotationChallenge } = authShareResponse;

            if (rotationChallenge) {
              const { authShare, deviceShare } =
                await WalletUtils.generateWalletWorkShares(jwk);

              const {
                shareHash: deviceShareHash,
                sharePublicKey: deviceSharePublicKey
              } = await WalletUtils.generateShareHashAndPublicKey(deviceShare);

              const challengeSolution = await ChallengeClientV1.solveChallenge({
                challenge: rotationChallenge,
                session: EMPTY_SESSION,
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

              WalletUtils.storeDeviceShare(walletId, deviceShare, userId);
            } else {
              WalletUtils.storeDeviceShare(
                walletId,
                authShareResponse.deviceShare,
                userId
              );
            }

            const dbWallet = dbWallets.find((dbWallet) => {
              return dbWallet.address === walletAddress;
            });

            try {
              await addWallet(jwk, dbWallet);
            } finally {
              freeDecryptedWallet(jwk);
            }

            authStatus = "unlocked";
          } else {
            authStatus = "noShares";
          }
        } else {
          authStatus = "noShares";
        }
      } else {
        authStatus = "noWallets";
      }

      setEmbeddedContextState((prevAuthContextState) => ({
        ...prevAuthContextState,
        authStatus,
        userId
      }));
    },
    []
  );

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (isInitializedRef.current) return;

    isInitializedRef.current = true;

    async function init() {
      log(
        LOG_GROUP.SETUP,
        `Initializing ArConnect Embedded background services...`
      );
      setupBackgroundService();

      log(LOG_GROUP.SETUP, `Initializing ArConnect Embedded wallets...`);
      initEmbeddedWallet();
    }

    init();
  }, [initEmbeddedWallet]);

  const authenticate = useCallback(
    async (authProviderType: AuthProviderType) => {
      // TODO: What to do if this is called while already authenticated?

      // TODO: Handle errors:
      await initEmbeddedWallet(authProviderType);
    },
    [initEmbeddedWallet]
  );

  return (
    <EmbeddedContext.Provider
      value={{
        ...embeddedContextState,

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
