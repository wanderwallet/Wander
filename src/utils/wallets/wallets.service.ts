import {
  Chain,
  trpcVanilla,
  WalletPrivacySetting,
  WalletStatus
} from "embed-api";
import {
  WalletUtils,
  type DeviceNonce,
  type DeviceShareInfo
} from "~utils/wallets/wallets.utils";

async function fetchWallets() {
  return trpcVanilla.fetchWallets.query();
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

export type RegisterRecoveryShareParams = Omit<
  Exclude<Parameters<typeof trpcVanilla.registerRecoveryShare.mutate>[0], void>,
  ""
>;

async function registerRecoveryShare(
  recoveryData: RegisterRecoveryShareParams
): Promise<void> {
  return trpcVanilla.registerRecoveryShare.mutate(recoveryData);
}

// TODO: Add registerWalletExport

export interface FetchFirstAvailableAuthShareParams {
  deviceNonce: DeviceNonce;
  deviceSharesInfo: DeviceShareInfo[];
}

export interface FetchFirstAvailableAuthShareReturn {
  walletAddress: string;
  authShare: string;
  deviceShare: string;
  rotateChallenge?: string;
}

async function fetchFirstAvailableAuthShare({
  deviceNonce,
  deviceSharesInfo
}: FetchFirstAvailableAuthShareParams): Promise<null | FetchFirstAvailableAuthShareReturn> {
  return new Promise(async (resolve, reject) => {
    for (const deviceSharesInfoItem of deviceSharesInfo) {
      const { walletAddress, deviceShare } = deviceSharesInfoItem;
      const deviceShareHash = await WalletUtils.generateShareHash(deviceShare);

      // TODO: Better with zk: instead of hashes or use a challenge here?

      const { authShare, rotateChallenge } = await FakeDB.getKeyShareForDevice({
        deviceNonce,
        walletAddress,
        deviceShareHash
      }).catch(() => ({
        authShare: null,
        rotateChallenge: null
      }));

      if (authShare) {
        // TODO: We need to have some date associated to the Share to force rotation. If `rotateChallenge` is ignored too many times, the share entry will be
        // removed and the user will be forced to use the recovery share or a keyfile/seedphrase.

        resolve({
          walletAddress,
          authShare,
          deviceShare,
          rotateChallenge
        });

        return;
      }
    }

    resolve(null);
  });
}

export interface RotateDeviceShareParams {
  walletAddress: string;
  oldDeviceNonce?: DeviceNonce;
  newDeviceNonce: DeviceNonce;
  authShare: string;
  newDeviceShareHash: string;
  challengeSignature: string;
}

async function rotateAuthShare({}: RotateDeviceShareParams) {
  // TODO: Take into account challengeSignature needs to be used as key too. Also, `oldDeviceNonce` might be `undefined`
  // but only when `initiateWalletRecovery` has been called before...
}

export interface InitiateWalletRecoveryReturn {
  recoveryChallenge: string;
  rotateChallenge: string;
}

async function fetchWalletRecoveryChallenge(
  walletAddress: string,
  recoverySharePublicKey: string
): Promise<InitiateWalletRecoveryReturn> {
  return Promise.resolve({
    recoveryChallenge: "",
    rotateChallenge: ""
  });
}

async function recoverWallet(
  walletAddress: string,
  challengeSignature: string
): Promise<string> {
  return FakeDB.recoverWallet(walletAddress, challengeSignature);
}

export const WalletService = {
  fetchWallets,
  createPublicWallet,
  registerRecoveryShare,
  fetchFirstAvailableAuthShare,
  rotateAuthShare,
  fetchWalletRecoveryChallenge,
  recoverWallet
};
