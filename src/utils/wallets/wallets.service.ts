import { ChallengeClientV1, type DbChallenge, type DbSession } from "embed-api";
import type {
  Wallet,
  WalletActivationStatus
} from "~utils/embedded/embedded.types";
import { trpcVanilla } from "~utils/embedded/embedded.utils";
import { WalletUtils } from "~utils/wallets/wallets.utils";
import { getWallets, removeWallet } from "~wallets";

// TODO: Consider getting `userId` automatically
async function fetchWallets(userId: string): Promise<Wallet[]> {
  const deviceShares = WalletUtils.getDeviceSharesForUser(userId);
  const unusedDeviceSharesWalletIDs = new Set(Object.keys(deviceShares));

  const storageWallets = await getWallets();
  const unusedStorageWalletsAddresses = new Set(
    storageWallets.map((storageWallet) => storageWallet.address)
  );

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
        if (
          dbWallet.totalExports === 0 &&
          dbWallet.totalBackups === 0 &&
          dbWallet.source.type === "GENERATED"
        ) {
          activationStatus = "lost";
        } else {
          activationStatus = "recoveryNeeded";
        }
      }

      return {
        ...dbWallet,
        activationStatus,
        authShare: null,
        deviceShare
      } satisfies Wallet;
    })
    .sort((a, b) => {
      // Most recently activated first:
      return b.lastActivatedAt.getTime() - a.lastActivatedAt.getTime();
    });

  if (unusedDeviceSharesWalletIDs.size > 0) {
    console.warn(
      `Orphan deviceShares stored in localStorage with IDs = ${Array.from(
        unusedDeviceSharesWalletIDs
      ).join(", ")}`
    );

    unusedDeviceSharesWalletIDs.forEach((unusedDeviceSharesWalletID) => {
      WalletUtils.removeDeviceShare(unusedDeviceSharesWalletID, userId);
    });
  }

  if (unusedStorageWalletsAddresses.size > 0) {
    // TODO: These should actually be stored in memory. Clean up should not be necessary.

    console.warn(
      `Left over wallets stored in sessionStorage with addresses = ${Array.from(
        unusedStorageWalletsAddresses
      ).join(", ")}`
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
    canRecoverAccountSetting: true
  });
}

export type DoNotAskAgainForBackupData = Exclude<
  Parameters<typeof trpcVanilla.doNotAskAgainForBackup.mutate>[0],
  void
>;

async function doNotAskAgainForBackup(
  doNotAskAgainForBackupData: DoNotAskAgainForBackupData
) {
  return trpcVanilla.doNotAskAgainForBackup.mutate(doNotAskAgainForBackupData);
}

export type RegisterRecoveryShareData = Exclude<
  Parameters<typeof trpcVanilla.registerRecoveryShare.mutate>[0],
  void
>;

async function registerRecoveryShare(
  recoveryShareData: RegisterRecoveryShareData
) {
  return trpcVanilla.registerRecoveryShare.mutate(recoveryShareData);
}

export type RegisterWalletExportData = Exclude<
  Parameters<typeof trpcVanilla.registerWalletExport.mutate>[0],
  void
>;

async function registerWalletExport(
  walletExportData: RegisterWalletExportData
) {
  return trpcVanilla.registerWalletExport.mutate(walletExportData);
}

export interface FetchFirstAvailableAuthShareReturn {
  activatedWallet: null | Wallet;
  rotationChallenge?: DbChallenge;
}

async function fetchFirstAvailableAuthShare(
  wallets: Wallet[],
  session: DbSession
): Promise<FetchFirstAvailableAuthShareReturn> {
  return new Promise(async (resolve, reject) => {
    for (const wallet of wallets) {
      const { id: walletId, deviceShare } = wallet;

      try {
        const {
          shareHash: deviceShareHash,
          sharePrivateKeyJWK: deviceSharePrivateKeyJWK
        } = await WalletUtils.generateShareHashAndPrivateKey(deviceShare);

        const { activationChallenge } =
          await trpcVanilla.generateWalletActivationChallenge.mutate({
            walletId
          });

        const challengeSolution = await ChallengeClientV1.solveChallenge({
          challenge: activationChallenge,
          session,
          shareHash: deviceShareHash,
          jwk: deviceSharePrivateKeyJWK
        });

        const { authShare, rotationChallenge } =
          await trpcVanilla.activateWallet.mutate({
            walletId,
            challengeSolution
          });

        // TODO: Better with zk: instead of hashes or use a challenge here?

        if (authShare) {
          const activatedWallet: Wallet = {
            ...wallet,
            activationStatus: "active",
            authShare
          };

          resolve({
            activatedWallet,
            rotationChallenge
          } satisfies FetchFirstAvailableAuthShareReturn);

          return;
        }
      } catch (err) {
        console.warn(`Wallet ${walletId} activation error =`, err);
      }
    }

    resolve({
      activatedWallet: null
    } satisfies FetchFirstAvailableAuthShareReturn);
  });
}

export type RotateAuthShareData = Exclude<
  Parameters<typeof trpcVanilla.rotateAuthShare.mutate>[0],
  void
>;

async function rotateAuthShare(rotateAuthShareData: RotateAuthShareData) {
  return trpcVanilla.rotateAuthShare.mutate(rotateAuthShareData);
}

export type GenerateWalletRecoveryChallengeData = Exclude<
  Parameters<typeof trpcVanilla.generateWalletRecoveryChallenge.mutate>[0],
  void
>;

async function generateWalletRecoveryChallenge(
  generateWalletRecoveryChallengeData: GenerateWalletRecoveryChallengeData
) {
  return trpcVanilla.generateWalletRecoveryChallenge.mutate(
    generateWalletRecoveryChallengeData
  );
}

export type RecoverWalletData = Exclude<
  Parameters<typeof trpcVanilla.recoverWallet.mutate>[0],
  void
>;

async function recoverWallet(recoverWalletData: RecoverWalletData) {
  return trpcVanilla.recoverWallet.mutate(recoverWalletData);
}

export type RegisterAuthShareData = Exclude<
  Parameters<typeof trpcVanilla.registerAuthShare.mutate>[0],
  void
>;

async function registerAuthShare(registerAuthShareData: RegisterAuthShareData) {
  return trpcVanilla.registerAuthShare.mutate(registerAuthShareData);
}

export const WalletService = {
  fetchWallets,
  doNotAskAgainForBackup,
  createPublicWallet,
  registerRecoveryShare,
  registerWalletExport,
  fetchFirstAvailableAuthShare,
  rotateAuthShare,
  generateWalletRecoveryChallenge,
  recoverWallet,
  registerAuthShare
};
