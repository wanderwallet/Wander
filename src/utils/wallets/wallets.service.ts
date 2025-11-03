import { solveChallenge, ErrorMessages, type DbSession } from "embed-api";
import type { Wallet, WalletActivationStatus } from "~utils/embedded/embedded.types";
import { trpcVanilla } from "~utils/embedded/embedded.utils";
import { isTRPCClientError } from "~utils/embedded/utils/trpc/trpc.utils";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { getWallets, removeWallet } from "~wallets";
import type { JWKInterface } from "arweave/web/lib/wallet";
import { freeDecryptedWallet } from "~wallets/encryption";

// TODO: Consider getting `userId` automatically

async function fetchWallets(userId: string): Promise<Wallet[]> {
  const deviceShares = await WalletUtils.getDeviceSharesForUser(userId);
  const unusedDeviceSharesWalletIDs = new Set(Object.keys(deviceShares));

  const storageWallets = await getWallets();
  const unusedStorageWalletsAddresses = new Set(storageWallets.map((storageWallet) => storageWallet.address));

  const { wallets: dbWallets } = await trpcVanilla.fetchWallets.query();

  const wallets = dbWallets
    .map((dbWallet) => {
      const walletId = dbWallet.id;
      const walletStatus = dbWallet.status;
      const deviceShare = deviceShares[walletId] || null;

      if (deviceShare) unusedDeviceSharesWalletIDs.delete(walletId);
      unusedStorageWalletsAddresses.delete(dbWallet.address);

      let activationStatus: WalletActivationStatus = "authNeeded";

      if (walletStatus !== "ENABLED") {
        activationStatus = "disabled";
      } else if (!deviceShare) {
        if (dbWallet.totalExports === 0 && dbWallet.totalBackups === 0 && dbWallet.source.type === "GENERATED") {
          activationStatus = "lost";
        } else {
          activationStatus = "recoveryNeeded";
        }
      }

      return {
        ...dbWallet,
        activationStatus,
        authShare: null,
        deviceShare,
      } satisfies Wallet;
    })
    .sort((a, b) => {
      // If `lastActivatedAt`, the wallet has just been created but the user closed the tab before the share public key
      // was generated, so the newly created wallet was never activated, but we consider that the most recent one.
      const lastActivationA = a.lastActivatedAt || new Date();
      const lastActivationB = b.lastActivatedAt || new Date();

      // Most recently activated first:
      return lastActivationB.getTime() - lastActivationA.getTime();
    });

  if (unusedDeviceSharesWalletIDs.size > 0) {
    console.warn(
      `Orphan deviceShares stored in localStorage with IDs = ${Array.from(unusedDeviceSharesWalletIDs).join(", ")}`,
    );

    unusedDeviceSharesWalletIDs.forEach(async (unusedDeviceSharesWalletID) => {
      await WalletUtils.removeDeviceShare(unusedDeviceSharesWalletID, userId);
    });
  }

  if (unusedStorageWalletsAddresses.size > 0) {
    // TODO: These should actually be stored in memory. Clean up should not be necessary.

    console.warn(
      `Left over wallets stored in sessionStorage with addresses = ${Array.from(unusedStorageWalletsAddresses).join(
        ", ",
      )}`,
    );

    for (const unusedStorageWalletsAddress of unusedStorageWalletsAddresses) {
      await removeWallet(unusedStorageWalletsAddress);
    }
  }

  return wallets;
}

export type CreatePublicWalletParams = Omit<
  Exclude<Parameters<typeof trpcVanilla.createPublicWallet.mutate>[0], void>,
  "status" | "chain" | "walletPrivacySetting" | "canRecoverAccountSetting"
>;

async function createPublicWallet(wallet: CreatePublicWalletParams) {
  return trpcVanilla.createPublicWallet.mutate({
    ...wallet,
    status: "ENABLED",
    chain: "ARWEAVE",
    walletPrivacySetting: "PUBLIC",
    canRecoverAccountSetting: true,
  });
}

export type RegisterRecoveryShareData = Exclude<Parameters<typeof trpcVanilla.registerRecoveryShare.mutate>[0], void>;

async function registerRecoveryShare(recoveryShareData: RegisterRecoveryShareData) {
  return trpcVanilla.registerRecoveryShare.mutate(recoveryShareData);
}

export type RegisterWalletExportData = Exclude<Parameters<typeof trpcVanilla.registerWalletExport.mutate>[0], void>;

async function registerWalletExport(walletExportData: RegisterWalletExportData) {
  return trpcVanilla.registerWalletExport.mutate(walletExportData);
}

export interface FetchFirstAvailableAuthShareReturn {
  jwk: null | JWKInterface;
  activatedWallet: null | Wallet;
}

async function fetchFirstAvailableAuthShare(
  wallets: Wallet[],
  session: DbSession,
  userId: string,
): Promise<FetchFirstAvailableAuthShareReturn> {
  return new Promise<FetchFirstAvailableAuthShareReturn>(async (resolve, reject) => {
    let jwk: JWKInterface | null = null;
    let error: Error | null = null;

    for (const wallet of wallets) {
      const { id: walletId, address: walletAddress, deviceShare } = wallet;

      try {
        if (deviceShare === null || wallet.status !== "ENABLED") {
          // If the device share is not present in the device, skip, otherwise
          // `WalletUtils.generateShareHashAndPrivateKey()` will throw an error.
          continue;
        }

        const generateShareHashAndEdKeysPromise = WalletUtils.generateShareHashAndEdKeys({
          deviceShare,
          session,
        });

        const generateWalletActivationChallengePromise = trpcVanilla.generateWalletActivationChallenge.mutate({
          walletId,
        });

        const [generateShareHashAndEdKeysResult, generateWalletActivationChallengeResult] = await Promise.all([
          generateShareHashAndEdKeysPromise,
          generateWalletActivationChallengePromise,
        ]);

        let shareHash: string = generateShareHashAndEdKeysResult.shareHash;
        let sharePrivateKey: JWKInterface | Uint8Array = generateShareHashAndEdKeysResult.sharePrivateKey;

        const { activationChallenge } = generateWalletActivationChallengeResult;

        if (activationChallenge.version === "v1") {
          // If we got a v1 challenge, we still need to migrate this WorkKeyShare to EdDSA. To do that, we first need to
          // resolve a RSA challenge (old system). Then, we'll be able to reconstruct the private key and the backend
          // will request the rotation of the WorkKeyShare, which is done using the wallet private key and only accepts
          // EdDSA public keys.

          const derivedRSAKeys = await WalletUtils.deriveRSAKeys(deviceShare);
          sharePrivateKey = derivedRSAKeys.sharePrivateKeyJWK;
        }

        const challengeSolution = await solveChallenge({
          challenge: activationChallenge,
          session,
          shareHash,
          privateKey: sharePrivateKey,
        });

        const { authShare, rotationChallenge } = await trpcVanilla.activateWallet.mutate({
          walletId,
          challengeSolution,
        });

        if (authShare) {
          // In case there was a previous one already in memory:
          if (jwk) freeDecryptedWallet(jwk);

          jwk = await WalletUtils.generateWalletJWKFromShares(walletAddress, [authShare, deviceShare]);

          const activatedWallet: Wallet = {
            ...wallet,
            activationStatus: "active",
            authShare,
          };

          if (rotationChallenge) {
            const { authShare, deviceShare } = await WalletUtils.generateWalletWorkShares(jwk);

            // Replace authShare and deviceShare with the new ones:
            activatedWallet.authShare = authShare;
            activatedWallet.deviceShare = deviceShare;

            const { shareHash: deviceShareHash, sharePublicKeyB64: deviceSharePublicKey } =
              await WalletUtils.generateShareHashAndEdKeys({
                deviceShare,
                session,
              });

            const challengeSolution = await solveChallenge({
              challenge: rotationChallenge,
              session,
              shareHash: null,
              privateKey: jwk,
            });

            await rotateAuthShare({
              walletId,
              authShare,
              deviceShareHash,
              deviceSharePublicKey,
              challengeSolution,
            });
          }

          resolve({
            jwk,
            activatedWallet,
          });

          return;
        }
      } catch (err) {
        if (jwk) freeDecryptedWallet(jwk);

        if (
          isTRPCClientError(err) &&
          err.data.httpStatus === 404 &&
          ([ErrorMessages.WORK_SHARE_INVALIDATED, ErrorMessages.WORK_SHARE_NOT_FOUND] as string[]).includes(err.message)
        ) {
          // If we get one of these errors, we know we've tried to get an auth share that is already gone, so we can
          // delete its corresponding device share:

          console.warn(
            `The corresponding auth share for the device share stored for walletId = ${walletId} was not found. Deleting device share from this device...`,
          );

          await WalletUtils.removeDeviceShare(deviceShare, userId);
        } else {
          // Otherwise, for any other type of error, we handle it normally. Meaning, we'll try to repeat this same
          // activation and, if all attempts fail, we'll reject this Promise with this error.

          error = err;

          console.warn(`Unexpected wallet activation error (walletId = "${walletId}") =`, err);
        }
      }
    }

    // Once we've checked all wallets and tried to activate the ones that had a deviceShare, we:
    // - Rethrow the last error, if the activation (or rotation) of any of them failed.
    // - Resolve normally with null values, if none of them had a deviceShare.

    if (error) {
      reject(error);
    } else {
      resolve({
        jwk: null,
        activatedWallet: null,
      });
    }
  });
}

export type RotateAuthShareData = Exclude<Parameters<typeof trpcVanilla.rotateAuthShare.mutate>[0], void>;

async function rotateAuthShare(rotateAuthShareData: RotateAuthShareData) {
  return trpcVanilla.rotateAuthShare.mutate(rotateAuthShareData);
}

export type GenerateWalletRecoveryChallengeData = Exclude<
  Parameters<typeof trpcVanilla.generateWalletRecoveryChallenge.mutate>[0],
  void
>;

async function generateWalletRecoveryChallenge(
  generateWalletRecoveryChallengeData: GenerateWalletRecoveryChallengeData,
) {
  return trpcVanilla.generateWalletRecoveryChallenge.mutate(generateWalletRecoveryChallengeData);
}

export type RecoverWalletData = Exclude<Parameters<typeof trpcVanilla.recoverWallet.mutate>[0], void>;

async function recoverWallet(recoverWalletData: RecoverWalletData) {
  return trpcVanilla.recoverWallet.mutate(recoverWalletData);
}

export type RegisterAuthShareData = Exclude<Parameters<typeof trpcVanilla.registerAuthShare.mutate>[0], void>;

async function registerAuthShare(registerAuthShareData: RegisterAuthShareData) {
  return trpcVanilla.registerAuthShare.mutate(registerAuthShareData);
}

export type CreateCloudBackupData = Exclude<Parameters<typeof trpcVanilla.createCloudBackup.mutate>[0], void>;

async function createCloudBackup(createCloudBackupData: CreateCloudBackupData) {
  return trpcVanilla.createCloudBackup.mutate(createCloudBackupData);
}

export type FetchCloudBackupData = Exclude<Parameters<typeof trpcVanilla.fetchCloudBackup.query>[0], void>;
export type CloudBackup = Awaited<ReturnType<typeof fetchCloudBackup>>["cloudBackup"];

async function fetchCloudBackup(fetchCloudBackupData: FetchCloudBackupData) {
  return trpcVanilla.fetchCloudBackup.query(fetchCloudBackupData);
}

export type UpdateCloudBackupData = Exclude<Parameters<typeof trpcVanilla.updateCloudBackup.mutate>[0], void>;

async function updateCloudBackup(updateCloudBackupData: UpdateCloudBackupData) {
  return trpcVanilla.updateCloudBackup.mutate(updateCloudBackupData);
}

export type DeleteCloudBackupData = Exclude<Parameters<typeof trpcVanilla.deleteCloudBackup.mutate>[0], void>;

async function deleteCloudBackup(deleteCloudBackupData: DeleteCloudBackupData) {
  return trpcVanilla.deleteCloudBackup.mutate(deleteCloudBackupData);
}

export const WalletService = {
  fetchWallets,
  createPublicWallet,
  registerRecoveryShare,
  registerWalletExport,
  fetchFirstAvailableAuthShare,
  rotateAuthShare,
  generateWalletRecoveryChallenge,
  recoverWallet,
  registerAuthShare,
  createCloudBackup,
  fetchCloudBackup,
  updateCloudBackup,
  deleteCloudBackup,
};
