import { ChallengeClientV1, type DbChallenge, type DbWallet } from "embed-api";
import { EMPTY_SESSION } from "~utils/embedded/embedded.constants";
import type {
  Wallet,
  WalletActivationStatus
} from "~utils/embedded/embedded.types";
import { trpcVanilla } from "~utils/embedded/embedded.utils";
import { WalletUtils } from "~utils/wallets/wallets.utils";

// TODO: Use transformers/superjson to transform dates automatically and see how to get the right types straight from
// the trpc calls:

// TODO: Consider getting `userId` automatically
async function fetchWallets(userId: string): Promise<Wallet[]> {
  const deviceShares = WalletUtils.getDeviceSharesForUser(userId);
  const unusedDeviceSharesWalletIds = new Set(Object.keys(deviceShares));

  const dbWallets = (await trpcVanilla.fetchWallets.query())
    .wallets as unknown as DbWallet[];

  const wallets = dbWallets
    .map((dbWallet) => {
      const walletId = dbWallet.id;
      const walletStatus = dbWallet.status;
      const deviceShare = deviceShares[walletId] || null;

      if (deviceShare) unusedDeviceSharesWalletIds.delete(walletId);

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
      return (
        new Date(b.lastActivatedAt).getTime() -
        new Date(a.lastActivatedAt).getTime()
      );
    });

  if (unusedDeviceSharesWalletIds.size > 0) {
    console.warn(
      `Stored deviceShares for the following wallets not used: ${Array.from(
        unusedDeviceSharesWalletIds
      ).join(", ")}`
    );
  }

  // TODO: Also make sure we remove any wallet from the "BE storage" (sessionStorage) that is not listed here. However,
  // they should not be stored at all between refreshes.

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
  wallets: Wallet[]
): Promise<FetchFirstAvailableAuthShareReturn> {
  return new Promise(async (resolve, reject) => {
    for (const wallet of wallets) {
      const { id: walletId, deviceShare } = wallet;

      const { activationChallenge } =
        await trpcVanilla.generateWalletActivationChallenge
          .mutate({
            walletId
          })
          .catch(() => {
            return { activationChallenge: null };
          });

      if (!activationChallenge) continue;

      const {
        shareHash: deviceShareHash,
        sharePrivateKeyJWK: deviceSharePrivateKeyJWK
      } = await WalletUtils.generateShareHashAndPrivateKey(deviceShare);

      const challengeSolution = await ChallengeClientV1.solveChallenge({
        challenge: activationChallenge,
        session: EMPTY_SESSION,
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
        // TODO: We need to have some date associated to the Share to force rotation. If `rotationChallenge` is ignored too many times, the share entry will be
        // removed and the user will be forced to use the recovery share or a keyfile/seedphrase.

        const activatedWallet: Wallet = {
          ...wallet,
          activationStatus: "active",
          authShare
        };

        resolve({
          activatedWallet,
          rotationChallenge: rotationChallenge as unknown as DbChallenge
        } satisfies FetchFirstAvailableAuthShareReturn);

        return;
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
