import Arweave from "arweave";
import { findGateway } from "~gateways/wayfinder";
import { withRetry } from "./promises/retry";

interface Wallet {
  address: string;
}

export async function fetchWalletBalances(wallets: Wallet[]) {
  try {
    if (wallets.length === 0) return {};

    const gateway = await findGateway({});
    const arweave = new Arweave(gateway);

    const balances: Record<string, string> = {};

    await Promise.all(
      wallets.map(async (wallet) => {
        try {
          const winstonBalance = await withRetry(() =>
            arweave.wallets.getBalance(wallet.address)
          );
          const arBalance = arweave.ar.winstonToAr(winstonBalance);
          balances[wallet.address] = arBalance;
        } catch (error) {
          console.error(`Error fetching balance for ${wallet.address}:`, error);
          balances[wallet.address] = "0";
        }
      })
    );

    return balances;
  } catch (error) {
    console.error("Error fetching wallet balances:", error);
    return {};
  }
}
