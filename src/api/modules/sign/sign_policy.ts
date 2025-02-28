import Transaction from "arweave/web/lib/transaction";
import BigNumber from "bignumber.js";
import { DataItem } from "warp-arbundles";
import type { RawDataItem } from "../sign_data_item/types";
import type { AuthRequestData } from "~utils/auth/auth.types";
export type SignPolicy = "always_ask" | "ask_when_spending" | "auto_confirm";

export function checkIfUserNeedsToSign(
  signPolicy: SignPolicy,
  transaction?: Transaction | DataItem | RawDataItem,
  walletType: "local" | "hardware" = "local",
  apiName?: AuthRequestData["type"]
) {
  try {
    // Hardware wallets always need manual signing
    if (walletType === "hardware") return true;

    switch (signPolicy) {
      case "always_ask":
        // Always require manual authorization
        return true;

      case "ask_when_spending":
        if (apiName === "signature") return true;
        if (!transaction) return false;
        const tags = transaction?.tags || [];
        let isAo = false,
          isTransfer = false,
          hasQuantity = false;

        for (const tag of tags) {
          switch (tag.name) {
            case "Data-Protocol":
              isAo = tag.value === "ao";
              break;
            case "Action":
              isTransfer = tag.value === "Transfer";
              break;
            case "Quantity":
              hasQuantity = true;
              break;
          }
          if (isAo && isTransfer && hasQuantity) break;
        }

        if (isAo && (isTransfer || hasQuantity)) {
          return true;
        }

        // Require auth if transaction spends AR (quantity > 0) or has network fees
        const quantity =
          "quantity" in transaction
            ? new BigNumber(transaction.quantity)
            : new BigNumber(0);

        const reward =
          "reward" in transaction
            ? new BigNumber(transaction.reward)
            : new BigNumber(0);

        return !quantity.isZero() || !reward.isZero();

      case "auto_confirm":
        // Never require manual authorization
        return false;

      default:
        // Default to always asking if policy is undefined
        return true;
    }
  } catch {
    return true;
  }
}
