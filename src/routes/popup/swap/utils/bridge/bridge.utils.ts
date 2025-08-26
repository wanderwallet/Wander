import { getActiveAddress } from "~wallets";
import type { BridgeInfo, BridgeInfoResult, BridgeTransaction, BridgeTransactionResponse } from "./bridge.types";
import { AR_PROCESS_ID, WAR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import BigNumber from "bignumber.js";
import { gql } from "~gateways/api";
import { retryWithDelay } from "~utils/promises/retry";
import { AOX_SWAP_QUERY } from "../dex/dex.constants";
import { parseSwapTransaction, validateGqlResponse } from "../swap.utils";
import { goldskyGateway } from "~gateways/gateway";

const bridgeTxTypes = new Set(["mint", "burn"]);

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

  const { txs } = (await response.json()) as BridgeTransactionResponse;
  const transaction = txs.find((tx) => tx.txId === txId);

  if (!transaction) throw new Error("Transaction not found");

  return transaction;
}

export function validateBridgeTransaction(
  amountIn: string,
  wanderFee: string,
  networkFee: string,
  bridgeInfo: BridgeInfoResult,
  tokenIn: string,
  tokenOut: string,
): string | null {
  if (!bridgeInfo) return null;

  const amountInBN = BigNumber(amountIn).minus(wanderFee).minus(networkFee);
  const valueInBN = amountInBN.shiftedBy(-12);
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

export async function getAoxTransactions(address: string, cursor = "0") {
  const result = await retryWithDelay(async () => {
    const data = await fetch(`https://api.aox.xyz/txs?address=${address}&count=10&cursor=${cursor}`);
    if (!data.ok) throw new Error("Failed to fetch bridge transaction");

    const { txs, hasNextPage } = (await data.json()) as BridgeTransactionResponse;

    if (txs.length === 0) return { txs: [], hasNextPage, cursor };

    cursor = txs[txs.length - 1].rawId.toString();

    const arweaveTxs = txs.filter((tx) => tx.chainType === "arweave" && bridgeTxTypes.has(tx.txType));

    const txMap = new Map<string, BridgeTransaction>();

    for (const tx of arweaveTxs) {
      txMap.set(tx.txId, tx);
    }

    const txIds = Array.from(txMap.keys());
    const orderNoticesResult = await retryWithDelay(async () => {
      const data = await gql(AOX_SWAP_QUERY, { address, txIds }, goldskyGateway);

      validateGqlResponse(data);

      const edges = data?.data?.transactions?.edges || [];
      for (const edge of edges) {
        const swapTx = txMap.get(edge.node.id);
        if (swapTx) {
          edge.node.tags.push(
            ...[
              { name: "Bridge-Status", value: swapTx.status },
              { name: "To-Quantity", value: swapTx.quantity },
            ],
          );
        }
      }

      return edges;
    });

    return { txs: orderNoticesResult.map(parseSwapTransaction), hasNextPage, cursor };
  }, 2);

  return result;
}
