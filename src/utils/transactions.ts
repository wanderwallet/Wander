import type { GQLNodeInterface } from "ar-gql/dist/faces";
import { getArweaveLink } from "~gateways/utils";
import { fetchTokenByProcessId } from "~lib/transactions";
import { balanceToFractioned } from "~tokens/currency";
import { formatAddress } from "./format";
import arweaveLogo from "url:/assets/ar/logo_light.png";

/**
 * Saves AO transaction data to localStorage for immediate display
 * @param txId Transaction ID
 * @param tokenId AO token ID
 * @param recipient Recipient address
 * @param ownerAddress Owner address
 * @param amount Transaction amount
 * @param ticker Token ticker
 * @param networkFee Network fee
 * @param message Optional message
 */
export function saveAoTransactionToLocalStorage(
  txId: string,
  tokenId: string,
  recipient: string,
  ownerAddress: string,
  amount: string,
  ticker: string,
  networkFee: string,
  message?: string
) {
  localStorage.setItem(
    "latest_tx",
    JSON.stringify({
      id: txId,
      owner: { address: ownerAddress },
      recipient: recipient,
      quantity: { ar: amount },
      fee: { ar: networkFee },
      data: {
        size: message ? new TextEncoder().encode(message).length : 0
      },
      tags: [
        { name: "Data-Protocol", value: "ao" },
        { name: "Action", value: "Transfer" },
        { name: "Token", value: tokenId },
        { name: "Token-Address", value: tokenId },
        { name: "Recipient", value: recipient },
        { name: "Quantity", value: amount },
        { name: "Ticker", value: ticker }
      ]
    })
  );
}

/**
 * GraphQL query for fetching transaction details
 */
export const TRANSACTION_DETAILS_QUERY = `
  query($id: ID!) {
    transaction(id: $id) {
      owner {
        address
      }
      recipient
      fee {
        ar
      }
      data {
        size
        type
      }
      quantity {
        ar
      }
      tags {
        name
        value
      }
      block {
        height
        timestamp
      }
    }
  }
`;

export interface ProcessedAoTransaction {
  transaction: GQLNodeInterface;
  aoInfo?: {
    isAo: boolean;
    tokenId: string | null;
    ticker: string | null;
    logo: string;
  };
}

/**
 * Process AO transaction data from either a cached or fetched transaction
 * @param transaction The transaction data (cached or from API)
 * @param isCached Whether this is a cached transaction
 * @returns Processed transaction with AO-specific data
 */
export async function processAoTransaction(
  transaction: GQLNodeInterface,
  isCached: boolean = false
): Promise<ProcessedAoTransaction> {
  if (!transaction) return { transaction };

  // Check if this is an AO transaction
  const isAo = isCached
    ? transaction.tags.some(
        (tag) => tag.name === "Data-Protocol" && tag.value === "ao"
      )
    : transaction.tags.find((tag) => tag.name === "Data-Protocol")?.value ===
      "ao";

  if (!isAo) return { transaction };

  // Get token ID
  const tokenId = transaction.recipient;
  const tokenIdTag = transaction.tags.find(
    (tag) => tag.name === "Token-Address" || tag.name === "Token"
  );
  const tickerTag = transaction.tags.find((tag) => tag.name === "Ticker");

  // Process transaction data
  const processedTx = isCached ? transaction : { ...transaction };
  const aoRecipient = transaction.tags.find((tag) => tag.name === "Recipient");
  const aoQuantity = transaction.tags.find((tag) => tag.name === "Quantity");

  // Set default values
  let ticker = tickerTag?.value || null;
  let logo = arweaveLogo;

  try {
    // Fetch token info if needed
    const tokenToFetch = tokenIdTag?.value || tokenId;
    const tokenInfo =
      aoQuantity || !isCached
        ? await fetchTokenByProcessId(tokenToFetch)
        : null;

    if (tokenInfo) {
      // Set logo if available
      if (tokenInfo.Logo) {
        logo = await getArweaveLink(tokenInfo.Logo);
      }

      // Handle non-cached transaction specifics
      if (!isCached && aoQuantity) {
        // Set ticker based on token type
        ticker =
          tokenInfo.type === "collectible"
            ? tokenInfo.Name!
            : tokenInfo.Ticker!;

        // Calculate amount with proper denomination
        const amount = balanceToFractioned(aoQuantity.value, {
          id: tokenId,
          decimals: Number(tokenInfo.Denomination)
        });

        // Update transaction data
        processedTx.quantity = { ar: amount.toFixed(), winston: "" };
        if (aoRecipient) {
          processedTx.recipient = aoRecipient.value;
        }
      }
    } else if (!isCached && aoQuantity) {
      ticker = formatAddress(tokenId, 4);
      const amount = balanceToFractioned(aoQuantity.value, {
        id: tokenId,
        decimals: 0
      });
      processedTx.quantity = { ar: amount.toFixed(), winston: "" };
    }
  } catch {
    ticker = ticker || formatAddress(tokenIdTag?.value || tokenId, 4);
  }

  if (!ticker) {
    ticker = formatAddress(tokenIdTag?.value || tokenId, 4);
  }

  return {
    transaction: processedTx,
    aoInfo: {
      isAo: true,
      tokenId,
      ticker,
      logo
    }
  };
}
