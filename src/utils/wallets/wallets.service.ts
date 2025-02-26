import {
  Chain,
  ChallengeClientV1,
  WalletPrivacySetting,
  WalletStatus,
  type DbChallenge
} from "embed-api";
import { EMPTY_SESSION } from "~utils/embedded/embedded.constants";
import { trpcVanilla } from "~utils/embedded/embedded.utils";
import {
  WalletUtils,
  type DeviceShareInfo
} from "~utils/wallets/wallets.utils";

async function fetchWallets() {
  return (await trpcVanilla.fetchWallets.query()).wallets;
}

export type CreatePublicWalletParams = Omit<
  Exclude<Parameters<typeof trpcVanilla.createPublicWallet.mutate>[0], void>,
  "status" | "chain" | "walletPrivacySetting" | "canRecoverAccountSetting"
>;

async function createPublicWallet(wallet: CreatePublicWalletParams) {
  return trpcVanilla.createPublicWallet.mutate({
    ...wallet,
    status: WalletStatus.ENABLED,
    chain: Chain.ARWEAVE,
    walletPrivacySetting: WalletPrivacySetting.PUBLIC,
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
  walletId: string;
  authShare: string;
  deviceShare: string;
  rotationChallenge: DbChallenge;
}

async function fetchFirstAvailableAuthShare(
  deviceSharesInfo: DeviceShareInfo[]
): Promise<FetchFirstAvailableAuthShareReturn> {
  return new Promise(async (resolve, reject) => {
    for (const deviceShareInfo of deviceSharesInfo) {
      const { walletId, deviceShare } = deviceShareInfo;

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

      const activateWalletResponse = await trpcVanilla.activateWallet.mutate({
        walletId,
        challengeSolution
      });

      // TODO: Better with zk: instead of hashes or use a challenge here?

      if (activateWalletResponse) {
        // TODO: We need to have some date associated to the Share to force rotation. If `rotationChallenge` is ignored too many times, the share entry will be
        // removed and the user will be forced to use the recovery share or a keyfile/seedphrase.

        resolve({
          walletId,
          authShare: activateWalletResponse.authShare,
          deviceShare,
          rotationChallenge: activateWalletResponse.rotationChallenge
        });

        return;
      }
    }

    resolve(null);
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
