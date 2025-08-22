import { getActiveAddress } from "~wallets";
import type { BridgeInfo, BridgeTransaction, BridgeInfoResult } from "./bridge.types";
import { AR_PROCESS_ID, WAR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import BigNumber from "bignumber.js";

export async function getBridgeInfo(): Promise<BridgeInfoResult> {
  const response = await fetch("https://api.aox.xyz/info");
  if (!response.ok) throw new Error("Failed to fetch bridge info");

  const bridgeInfo = (await response.json()) as BridgeInfo;

  const arToken = bridgeInfo.chainTokens.find((token) => token.chainType === "arweave");
  const warToken = bridgeInfo.wrappedTokens.find((token) => token.wrappedTokenId === WAR_PROCESS_ID);
  const warBurnLimit = bridgeInfo.burnLimits[arToken.symbol];
  const arMintLimit = bridgeInfo.mintLimits[arToken.symbol];
  const arMintDisabled = bridgeInfo.closeServer.closeArweaveMint || false;
  const warBurnDisabled = bridgeInfo.closeServer.closeArweaveBurn || false;

  return { arToken, warToken, warBurnLimit, arMintLimit, arMintDisabled, warBurnDisabled };
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

export function validateBridgeTransaction(
  amountIn: string,
  bridgeInfo: BridgeInfoResult,
  tokenIn: string,
  tokenOut: string,
): string | null {
  if (!bridgeInfo) return null;

  const amountInBN = BigNumber(amountIn);
  const valueInBN = BigNumber(amountIn).shiftedBy(-12);
  const isARToWAR = tokenIn === AR_PROCESS_ID;
  const isWARToAR = tokenOut === AR_PROCESS_ID;

  // Check if AR -> wAR bridge is disabled
  if (isARToWAR && bridgeInfo.arMintDisabled) {
    return "Bridge temporarily closed. Try again later";
  }

  // Check if wAR -> AR bridge is disabled
  if (isWARToAR && bridgeInfo.warBurnDisabled) {
    return "Bridge temporarily closed. Try again later";
  }

  if (isWARToAR && amountInBN.lt(bridgeInfo.warToken.minBurnAmt)) {
    return `Amount too low. Minimum: ${BigNumber(bridgeInfo.warToken.minBurnAmt).shiftedBy(-12).toFixed()} wAR`;
  }

  // Check wAR -> AR burn limits
  if (isWARToAR && bridgeInfo.warBurnLimit) {
    const { perLimit, dailyLimit, dailyBurned } = bridgeInfo.warBurnLimit;
    const perLimitBN = BigNumber(perLimit);
    const remainingDailyLimitBN = BigNumber(dailyLimit).minus(dailyBurned);

    if (valueInBN.gt(perLimitBN)) {
      return `Amount too high. Max per transaction: ${perLimitBN.shiftedBy(-12).toFixed()} wAR`;
    }

    if (valueInBN.gt(remainingDailyLimitBN)) {
      return `Daily limit reached. Available today: ${remainingDailyLimitBN.shiftedBy(-12).toFixed()} wAR`;
    }
  }

  // Check AR -> wAR mint limits
  if (isARToWAR && bridgeInfo.arMintLimit && valueInBN.gt(bridgeInfo.arMintLimit)) {
    return `Amount too high. Maximum allowed: ${BigNumber(bridgeInfo.arMintLimit).shiftedBy(-12).toFixed()} AR`;
  }

  return null;
}
