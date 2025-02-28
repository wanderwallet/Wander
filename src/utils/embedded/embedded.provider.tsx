import type { JWKInterface } from "arweave/web/lib/wallet";
import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { setupBackgroundService } from "~api/background/background-setup";
import { AuthenticationService } from "~utils/authentication/authentication.service";
import {
  MockedFeatureFlags,
  type AuthMethod,
  type DbWallet
} from "~utils/authentication/fakeDB";
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
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { isTempWalletPromiseExpired } from "~utils/embedded/utils/wallets/embedded-wallets.utils";

const EMBEDDED_CONTEXT_INITIAL_STATE: EmbeddedContextState = {
  authStatus: "unknown",
  authMethod: null,
  userId: null,
  wallets: [],
  generatedTempWalletAddress: null,
  importedTempWalletAddress: null,
  lastRegisteredWallet: null,
  recoverableAccounts: null,
  promptToBackUp: true,
  backedUp: false
};

export const EmbeddedContext = createContext<EmbeddedContextData>({
  ...EMBEDDED_CONTEXT_INITIAL_STATE,
  authenticate: async () => null,
  fetchRecoverableAccounts: async () => null,
  clearRecoverableAccounts: async () => null,
  recoverAccount: async () => null,
  restoreWallet: async () => null,

  generateTempWallet: async () => null,
  deleteGeneratedTempWallet: async () => null,

  importTempWallet: async () => null,
  deleteImportedTempWallet: async () => null,

  registerWallet: async () => null,
  clearLastRegisteredWallet: () => null,

  // TODO: These should work for multiple wallets:
  skipBackUp: () => null,
  registerBackUp: async () => null,
  downloadKeyfile: async () => null,
  copySeedphrase: async () => null,
  generateRecoveryAndDownload: async () => null
});

export function EmbeddedProvider({ children }: EmbeddedProviderProps) {
  const [embeddedContextState, setEmbeddedContextState] =
    useState<EmbeddedContextState>(EMBEDDED_CONTEXT_INITIAL_STATE);

  const { authStatus, userId, wallets } = embeddedContextState;

  useEffect(() => {
    if (authStatus !== "unknown") {
      const coverElement = document.getElementById("cover");

      coverElement.setAttribute("aria-hidden", "true");
    }
  }, [authStatus]);

  const skipBackUp = useCallback(async (doNotAskAgain: boolean) => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `skipBackUp(${doNotAskAgain})`);

    // TODO: Persist lastPromptData (local?) and doNotAskAgain (server?) (for the current wallet only?)

    if (doNotAskAgain) {
      await sleep(5000);
    }

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      promptToBackUp: false
    }));
  }, []);

  const registerBackUp = useCallback(async () => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `registerBackUp()`);

    // TODO: Call this function when downloadKeyfile or copySeedphrase are used.

    await sleep(5000);

    setEmbeddedContextState((prevAuthContextState) => ({
      ...prevAuthContextState,
      backedUp: true
    }));
  }, []);

  const downloadKeyfile = useCallback(async (walletAddress: string) => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `downloadKeyfile(${walletAddress})`);

    // TODO: Add an option to encrypt with a password

    const decryptedWallet = (await getKeyfile(
      walletAddress
    )) as LocalWallet<JWKInterface>;

    downloadKeyfileUtil(walletAddress, decryptedWallet.keyfile);

    // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
    freeDecryptedWallet(decryptedWallet.keyfile);
  }, []);

  const copySeedphrase = useCallback(async (walletAddress: string) => {
    log(LOG_GROUP.EMBEDDED_FLOWS, `copySeedphrase(${walletAddress})`);

    const seedPhrase = WalletUtils.getDecryptedSeedPhrase(
      walletAddress,
      {} as any
    );

    await navigator.clipboard.writeText(seedPhrase);
  }, []);

  const generateRecoveryAndDownload = useCallback(
    async (walletAddress: string) => {
      log(
        LOG_GROUP.EMBEDDED_FLOWS,
        `generateRecoveryAndDownload(${walletAddress})`
      );

      const decryptedWallet = (await getKeyfile(
        walletAddress
      )) as LocalWallet<JWKInterface>;

      const jwk = decryptedWallet.keyfile;

      const { recoveryAuthShare, recoveryBackupShare } =
        await WalletUtils.generateWalletRecoveryShares(jwk);

      const recoveryBackupShareHash = await WalletUtils.generateShareHash(
        recoveryBackupShare
      );

      // TODO: Should we just show an error and make sure the device nonce is generated in a single place on app load?
      const deviceNonce =
        WalletUtils.getDeviceNonce() || WalletUtils.generateDeviceNonce();

      const walletId = wallets.find(
        (wallet) => wallet.address === walletAddress
      )?.id;

      if (!walletId) throw new Error("Can't find walletId");

      await WalletService.createRecoveryShare({
        walletId,
        walletAddress,
        deviceNonce,
        recoveryAuthShare,
        recoveryBackupShareHash,
        deviceInfo: {}
      });

      // TODO: Should we just show an error and make sure the device nonce is generated in a single place on app load?
      WalletUtils.storeDeviceNonce(deviceNonce);

      downloadRecoveryFile(walletAddress, recoveryBackupShare);

      // TODO: Make sure we use `freeDecryptedWallet` all over the place in the new code for Embedded:
      freeDecryptedWallet(jwk);
    },
    [wallets]
  );

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
    async (sourceType: "generated" | "imported") => {
      log(LOG_GROUP.WALLET_GENERATION, `registerWallet(${sourceType})`);

      const promise =
        sourceType === "generated"
          ? generatedTempWalletPromiseRef.current?.promise
          : importedTempWalletPromiseRef.current?.promise;

      const { seedPhrase, jwk, walletAddress } = await promise;

      const { authShare, deviceShare } =
        await WalletUtils.generateWalletWorkShares(jwk);

      const deviceShareHash = await WalletUtils.generateShareHash(deviceShare);

      const deviceNonce =
        WalletUtils.getDeviceNonce() || WalletUtils.generateDeviceNonce();

      const dbWallet = await WalletService.createWallet({
        address: walletAddress,
        publicKey: jwk.n,
        walletType: "public",
        deviceNonce,
        authShare,
        deviceShareHash,
        canBeUsedToRecoverAccount: true, // TODO: What should be the default here?
        deviceInfo: {},

        source: {
          type: sourceType,
          from: seedPhrase ? "seedPhrase" : "keyFile"
        }
      });

      WalletUtils.storeDeviceNonce(deviceNonce);
      WalletUtils.storeDeviceShare(deviceShare, userId, walletAddress);

      // TODO: This flag must be checked on launch and the stored seedphrase should be removed if the flag becomes false.
      if (seedPhrase && MockedFeatureFlags.maintainSeedPhrase) {
        WalletUtils.storeEncryptedSeedPhrase(walletAddress, seedPhrase, jwk);
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

    const challenge = await AuthenticationService.fetchWalletRecoveryChallenge(
      walletAddress
    );
    const challengeSignature = await WalletUtils.generateChallengeSignature(
      challenge,
      jwk
    );
    const recoverableAccounts =
      await AuthenticationService.fetchRecoverableAccounts(
        walletAddress,
        challengeSignature
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
    async (authMethod: AuthMethod, accountToRecoverId: string) => {
      log(
        LOG_GROUP.WALLET_GENERATION,
        `recoverAccount(${authMethod}, ${accountToRecoverId})`
      );

      const { jwk, walletAddress } = await importedTempWalletPromiseRef.current
        ?.promise;

      const challenge =
        await AuthenticationService.fetchAccountRecoveryChallenge(
          accountToRecoverId,
          walletAddress
        );
      const challengeSignature = await WalletUtils.generateChallengeSignature(
        challenge,
        jwk
      );

      await AuthenticationService.recoverAccount(
        authMethod,
        accountToRecoverId,
        walletAddress,
        challengeSignature
      );

      // TODO: The imported wallet needs to be split and the authShare sent to the backend. Then, wallets need to be
      // fetched...
    },
    []
  );

  const restoreWallet = useCallback(
    async (
      walletAddress: string,
      recoveryData: RecoveryJSON | JWKInterface | string
    ) => {
      if (
        typeof recoveryData === "string" ||
        recoveryData.hasOwnProperty("kty")
      ) {
        throw new Error("Keyfile sand seedphrases not supported yet.");
      }

      const { version, recoveryBackupShare } = recoveryData as RecoveryJSON;

      // TODO: Do this with signatures if possible, otherwise do it with hashes:
      const recoveryShareJWT: JWKInterface = {} as any;
      const recoverySharePublicKey = "";

      const { recoveryChallenge, rotateChallenge } =
        await WalletService.fetchWalletRecoveryChallenge(
          walletAddress,
          recoverySharePublicKey
        );

      const recoveryShareHash = await WalletUtils.generateShareHash(
        recoveryBackupShare
      );

      const recoveryChallengeSignature =
        await WalletUtils.generateChallengeSignature(
          recoveryChallenge,
          recoveryShareJWT
        );

      const authRecoveryShare = await WalletService.recoverWallet(
        walletAddress,
        recoveryChallengeSignature
      );

      if (!authRecoveryShare) throw Error("Missing server recovery data.");

      const jwk = await WalletUtils.generateWalletJWKFromShares(walletAddress, [
        authRecoveryShare,
        recoveryBackupShare
      ]);

      const { authShare, deviceShare } =
        await WalletUtils.generateWalletWorkShares(jwk);

      const oldDeviceNonce = WalletUtils.getDeviceNonce();
      const newDeviceNonce = WalletUtils.generateDeviceNonce();

      // TODO: The rotate challenge is only needed if there's a deviceNonce-walletAddress-userId match
      // on the backend. Otherwise, we are just adding the wallet on a new device so we just need to store
      // the new work shares in the DB.
      const rotateChallengeSignature =
        await WalletUtils.generateChallengeSignature(rotateChallenge, jwk);

      // TODO: This wallet needs to be regenerated as well and the authShare updated. If this is not done after X
      // "warnings", the Shards entry will be removed anyway.
      await WalletService.rotateAuthShare({
        walletAddress,
        oldDeviceNonce,
        newDeviceNonce,
        authShare,
        newDeviceShareHash: "", // TODO: Better to use public keys.
        challengeSignature: rotateChallengeSignature
      });

      WalletUtils.storeDeviceNonce(newDeviceNonce);
      WalletUtils.storeDeviceShare(deviceShare, userId, walletAddress);

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

  const initEmbeddedWallet = useCallback(async (authMethod?: AuthMethod) => {
    setEmbeddedContextState({
      ...EMBEDDED_CONTEXT_INITIAL_STATE,
      authStatus: "authLoading",
      authMethod
    });

    // TODO: Handle errors:
    const authentication = authMethod
      ? await AuthenticationService.authenticate(authMethod)
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

    const dbWallets = await WalletService.fetchWallets(userId);

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

    if (dbWallets.length > 0) {
      // TODO: The wallet activation can be deferred until the wallet is going to be used:

      // TODO: TODO: We need to keep track of the last used one, not the last created one:
      const deviceSharesInfo = WalletUtils.getDeviceSharesInfo(userId);

      // TODO: Verify if wallets match between dbWallets and deviceSharesInfo before
      // calling fetchFirstAvailableAuthShare().

      // TODO: If we think the wallets are lost, we just show a different screen like the "add wallet"
      // one but with a different message.

      // TODO: Create an issue for the new storage needs (e.g. expiration). Note that for wallets
      // that haven't been backup up, we must never delete a share without notifying the user.

      let deviceNonce = WalletUtils.getDeviceNonce();

      if (deviceNonce && deviceSharesInfo.length > 0) {
        const authShareResponse =
          await WalletService.fetchFirstAvailableAuthShare({
            deviceNonce,
            deviceSharesInfo
          });

        if (authShareResponse) {
          const { authShare, walletAddress, rotateChallenge } =
            authShareResponse;

          let { deviceShare } = authShareResponse;

          const jwk = await WalletUtils.generateWalletJWKFromShares(
            walletAddress,
            [authShare, deviceShare]
          );

          if (rotateChallenge) {
            const oldDeviceNonce = deviceNonce;
            const newDeviceNonce = WalletUtils.generateDeviceNonce();

            const { authShare: newAuthShare, deviceShare: newDeviceShare } =
              await WalletUtils.generateWalletWorkShares(jwk);

            const newDeviceShareHash = await WalletUtils.generateShareHash(
              newDeviceShare
            );

            const challengeSignature =
              await WalletUtils.generateChallengeSignature(
                rotateChallenge,
                jwk
              );

            await WalletService.rotateAuthShare({
              walletAddress,
              oldDeviceNonce,
              newDeviceNonce,
              authShare: newAuthShare,
              newDeviceShareHash,
              challengeSignature
            });

            deviceNonce = newDeviceNonce;
            deviceShare = newDeviceShare;
          }

          WalletUtils.storeDeviceNonce(deviceNonce);
          WalletUtils.storeDeviceShare(deviceShare, userId, walletAddress);

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
  }, []);

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
    async (authMethod: AuthMethod) => {
      // TODO: What to do if this is called while already authenticated?

      // TODO: Handle errors:
      await initEmbeddedWallet(authMethod);
    },
    [initEmbeddedWallet]
  );

  return (
    <EmbeddedContext.Provider
      value={{
        ...embeddedContextState,

        authenticate,
        fetchRecoverableAccounts,
        clearRecoverableAccounts,
        recoverAccount,
        restoreWallet,

        generateTempWallet,
        deleteGeneratedTempWallet,

        importTempWallet,
        deleteImportedTempWallet,

        registerWallet,
        clearLastRegisteredWallet,

        skipBackUp,
        registerBackUp,
        downloadKeyfile,
        copySeedphrase,
        generateRecoveryAndDownload
      }}
    >
      {children}
    </EmbeddedContext.Provider>
  );
}
