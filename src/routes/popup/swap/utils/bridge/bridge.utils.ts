import { getActiveAddress } from "~wallets";
import type { BridgeInfo, BridgeTransaction } from "./bridge.types";
import { WAR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";

export async function getBridgeInfo() {
  const response = await fetch("https://api.aox.xyz/info");
  if (!response.ok) throw new Error("Failed to fetch bridge info");

  const bridgeInfo = (await response.json()) as BridgeInfo;

  const arToken = bridgeInfo.chainTokens.find((token) => token.chainType === "arweave");
  const warToken = bridgeInfo.wrappedTokens.find((token) => token.wrappedTokenId === WAR_PROCESS_ID);
  const arBurnLimit = bridgeInfo.burnLimits[arToken.symbol];
  const arMintLimit = bridgeInfo.mintLimits[arToken.symbol];
  const arMintDisabled = bridgeInfo.closeServer.closeArweaveMint || false;
  const arBurnDisabled = bridgeInfo.closeServer.closeArweaveBurn || false;

  return { arToken, warToken, arBurnLimit, arMintLimit, arMintDisabled, arBurnDisabled };
}

export async function getBridgeTransaction(txId: string) {
  const activeAddress = await getActiveAddress();
  const response = await fetch(`https://api.aox.xyz/txs?address=${activeAddress}&count=30`);
  if (!response.ok) throw new Error("Failed to fetch bridge transaction");

  const { txs } = (await response.json()) as { txs: BridgeTransaction[] };
  const transaction = txs.find((tx) => tx.txId === txId);

  if (!transaction) throw new Error("Transaction not found");

  return transaction;
}
