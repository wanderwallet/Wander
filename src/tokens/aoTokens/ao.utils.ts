import { nonTransferableTokenIds, nonTransferableWhitelistedWallets } from "./ao.constants";

/**
 * Checks if a token is non-transferable for a given wallet address
 * @param tokenId - The ID of the token to check
 * @param walletAddress - The address of the wallet to check
 * @returns true if the token is non-transferable for the wallet address, false otherwise
 */
export function isNonTransferableToken(tokenId: string, walletAddress: string) {
  // Return false if required params are missing or token is transferable
  if (!tokenId || !walletAddress || !nonTransferableTokenIds.includes(tokenId)) {
    return false;
  }

  // Check if wallet is whitelisted for this token
  // If the wallet is whitelisted, return false
  const whitelistedWallets = nonTransferableWhitelistedWallets[tokenId];
  return !whitelistedWallets?.includes(walletAddress);
}
