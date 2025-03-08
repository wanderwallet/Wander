import { freeDecryptedWallet } from "~wallets/encryption";
import type { AllowanceBigNumber } from "~applications/allowance";
import type { ModuleAppData } from "~api/background/background-modules";
import { defaultGateway } from "~gateways/gateway";
import { signAuth } from "../sign/sign_auth";
import Arweave from "arweave";
import type { DataItem } from "arbundles";
import type Transaction from "arweave/web/lib/transaction";
import type BigNumber from "bignumber.js";
import type { JWKInterface } from "arweave/web/lib/wallet";

/**
 * Ensure allowance for dispatch
 */
export async function ensureAllowanceDispatch(
  dataEntry: DataItem | Transaction,
  appData: ModuleAppData,
  allowance: AllowanceBigNumber,
  keyfile: JWKInterface,
  price: number | BigNumber,
  alwaysAsk?: boolean
) {
  const arweave = new Arweave(defaultGateway);

  // allowance or sign auth
  try {
    if (alwaysAsk) {
      const address = await arweave.wallets.jwkToAddress(keyfile);

      await signAuth(
        appData,
        // @ts-expect-error
        dataEntry.toJSON(),
        address
      );
    }

    // if (allowance.enabled) {
    //   await allowanceAuth(appData, allowance, price, alwaysAsk);
    // }
  } catch (e) {
    freeDecryptedWallet(keyfile);
    throw new Error(e?.message || e);
  }
  return;
}
