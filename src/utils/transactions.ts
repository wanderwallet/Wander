/**
 * Utility functions for AO/AR transactions
 */

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
