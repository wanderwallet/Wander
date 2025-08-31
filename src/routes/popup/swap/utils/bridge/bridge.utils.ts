import type {
  AoxBridgeInfo,
  AoxBridgeInfoResult,
  AoxBridgeTransaction,
  AoxBridgeTransactionResponse,
  VentoBridgeInfo,
  VentoBridgeInfoResult,
  VentoBridgeTransactionResponse,
  VentoHealthInfo,
} from "./bridge.types";
import { AR_PROCESS_ID, VAR_PROCESS_ID, WAR_PROCESS_ID } from "~tokens/aoTokens/ao.constants";
import BigNumber from "bignumber.js";
import { gql } from "~gateways/api";
import { retryWithDelay } from "~utils/promises/retry";
import { SWAP_TXS_QUERY, VENTO_BURN_DEBIT_NOTICE_QUERY, VENTO_SWAP_QUERY_WITH_CURSOR } from "../dex/dex.constants";
import { fromTokenBaseUnits, parseSwapTransaction, validateGqlResponse } from "../swap.utils";
import { goldskyGateway } from "~gateways/gateway";
import { PoolTypeEnum } from "../swap.constants";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import browser from "webextension-polyfill";
import { getTagValue } from "~tokens/aoTokens/ao";

const aoxBridgeTxTypes = new Set(["mint", "burn"]);

export async function getAoxBridgeInfo(): Promise<AoxBridgeInfoResult> {
  const response = await fetch("https://api.aox.xyz/info");
  if (!response.ok) throw new Error("Failed to fetch bridge info");

  const bridgeInfo = (await response.json()) as AoxBridgeInfo;

  const arToken = bridgeInfo.chainTokens.find((token) => token.chainType === "arweave");
  const warToken = bridgeInfo.wrappedTokens.find((token) => token.wrappedTokenId === WAR_PROCESS_ID);
  const warBurnLimit = bridgeInfo.burnLimits[arToken.symbol];
  const arMintLimit = bridgeInfo.mintLimits[arToken.symbol];
  const arMintDisabled = bridgeInfo.closeServer.closeArweaveMint || false;
  const warBurnDisabled = bridgeInfo.closeServer.closeArweaveBurn || false;

  return { arToken, warToken, warBurnLimit, arMintLimit, arMintDisabled, warBurnDisabled, bridge: PoolTypeEnum.AOX };
}

export async function getVentoBridgeInfo(): Promise<VentoBridgeInfoResult> {
  const [bridgeResponse, healthResponse] = await Promise.all([
    fetch("https://api.ventoswap.com/bridge"),
    fetch("https://api.ventoswap.com/bridge/health"),
  ]);
  if (!bridgeResponse.ok) throw new Error("Failed to fetch bridge info");
  if (!healthResponse.ok) throw new Error("Failed to fetch bridge health info");

  const bridgeInfo = (await bridgeResponse.json()) as VentoBridgeInfo;
  const healthInfo = (await healthResponse.json()) as VentoHealthInfo;

  const minBridgeAmount = bridgeInfo.MININUM_ARWEAVE_BRIDGE;
  const bridgeFeeRate = bridgeInfo.FEES.AR;
  const isHealthy = healthInfo.status === "healthy" && healthInfo.apiStatus === 200;

  return { minBridgeAmount, bridge: PoolTypeEnum.VENTO, isHealthy, bridgeFeeRate };
}

export async function getAoxBridgeTransaction(txId: string) {
  const response = await fetch(`https://api.aox.xyz/tx/${txId}`);
  if (!response.ok) throw new Error("Failed to fetch bridge transaction");

  const tx = (await response.json()) as AoxBridgeTransaction;
  return tx;
}

export async function getVentoBridgeTransaction(txId: string, isAo?: boolean): Promise<VentoBridgeTransactionResponse> {
  const baseUrl = "https://api.ventoswap.com/bridge/status";
  const path = isAo === undefined ? "arweave" : isAo ? "ao" : "arweave";

  try {
    const response = await fetch(`${baseUrl}/${path}/${txId}`);
    if (response.ok) {
      const tx = await response.json();
      return tx;
    }

    // Only try ao path if isAo is undefined and first request failed
    if (isAo === undefined) {
      const aoResponse = await fetch(`${baseUrl}/ao/${txId}`);
      if (aoResponse.ok) {
        const tx = await aoResponse.json();
        return tx;
      }
    }
  } catch {}

  throw new Error("Failed to fetch bridge transaction");
}

export function validateAoxBridgeTransaction(
  amountIn: string,
  wanderFee: string,
  bridgeInfo: AoxBridgeInfoResult,
  tokenIn: string,
  tokenOut: string,
): string | null {
  if (!bridgeInfo) return null;

  const amountInBN = BigNumber(amountIn);
  const wanderFeeValueBN = fromTokenBaseUnits(wanderFee, 12, "BigNumber");
  const valueInBN = fromTokenBaseUnits(amountInBN, 12, "BigNumber");
  const isARToWAR = tokenIn === AR_PROCESS_ID;
  const isWARToAR = tokenOut === AR_PROCESS_ID;

  // Check if AR -> wAR bridge is disabled
  if (isARToWAR) {
    if (bridgeInfo.arMintDisabled) {
      return browser.i18n.getMessage("bridge_temporarily_closed");
    }

    // Check AR -> wAR mint limits
    const requiredArMintLimit = BigNumber(bridgeInfo.arMintLimit).plus(wanderFeeValueBN);
    if (valueInBN.gt(requiredArMintLimit)) {
      return browser.i18n.getMessage("amount_too_high", `${requiredArMintLimit.toFixed()} AR`);
    }
  }

  if (isWARToAR) {
    // Check if wAR -> AR bridge is disabled
    if (bridgeInfo.warBurnDisabled) {
      return browser.i18n.getMessage("bridge_temporarily_closed");
    }

    const minBurnAmt = bridgeInfo.warToken.minBurnAmt;
    const requiredMinBurnAmt = BigNumber(minBurnAmt).plus(wanderFee);

    if (amountInBN.lt(requiredMinBurnAmt)) {
      const requiredMinBurnValue = fromTokenBaseUnits(requiredMinBurnAmt, 12);
      return browser.i18n.getMessage("amount_too_low", `${requiredMinBurnValue} wAR`);
    }

    // Check wAR -> AR burn limits
    if (bridgeInfo.warBurnLimit) {
      const { perLimit, dailyLimit, dailyBurned } = bridgeInfo.warBurnLimit;
      const perLimitBN = BigNumber(perLimit);
      const remainingDailyLimitBN = BigNumber(dailyLimit).minus(dailyBurned);
      const requiredPerLimitBN = perLimitBN.plus(wanderFeeValueBN);
      const requiredRemainingDailyLimitBN = remainingDailyLimitBN.plus(wanderFeeValueBN);

      if (valueInBN.gt(requiredPerLimitBN)) {
        return browser.i18n.getMessage("amount_exceeds_per_transaction_limit", `${requiredPerLimitBN.toFixed()} wAR`);
      }

      if (valueInBN.gt(requiredRemainingDailyLimitBN)) {
        return browser.i18n.getMessage("daily_limit_reached", `${requiredRemainingDailyLimitBN.toFixed()} wAR`);
      }
    }
  }

  return null;
}

export function validateVentoBridgeTransaction(
  amountIn: string,
  wanderFee: string,
  bridgeInfo: VentoBridgeInfoResult,
  _tokenIn: string,
  _tokenOut: string,
): string | null {
  if (!bridgeInfo) return null;

  const amountInBN = BigNumber(amountIn);

  if (!bridgeInfo.isHealthy) {
    return browser.i18n.getMessage("bridge_temporarily_closed");
  }

  const requiredMinBN = BigNumber(bridgeInfo.minBridgeAmount).plus(wanderFee);

  if (amountInBN.lt(requiredMinBN)) {
    return browser.i18n.getMessage("amount_too_low", `${fromTokenBaseUnits(requiredMinBN, 12)} AR`);
  }

  return null;
}

export async function getAoxBridgeTransactions(address: string, cursor = "0") {
  const result = await retryWithDelay(async () => {
    const data = await fetch(`https://api.aox.xyz/txs?address=${address}&count=10&cursor=${cursor}`);
    if (!data.ok) throw new Error("Failed to fetch bridge transaction");

    const { txs, hasNextPage } = (await data.json()) as AoxBridgeTransactionResponse;

    if (txs.length === 0) return { txs: [], hasNextPage, cursor };

    cursor = txs[txs.length - 1].rawId.toString();

    const arweaveTxs = txs.filter((tx) => tx.chainType === "arweave" && aoxBridgeTxTypes.has(tx.txType));

    const txMap = new Map<string, AoxBridgeTransaction>();

    for (const tx of arweaveTxs) {
      txMap.set(tx.txId, tx);
    }

    const txIds = Array.from(txMap.keys());
    const transactions = await retryWithDelay(async () => {
      const data = await gql(SWAP_TXS_QUERY, { txIds }, goldskyGateway);

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
    }, 2);

    const parsedTransactions = transactions.map(parseSwapTransaction).filter(Boolean);
    return { txs: parsedTransactions, hasNextPage, cursor };
  }, 2);

  return result;
}

export async function getVentoBridgeTransactions(address: string, cursor = "") {
  // Get initial transaction data
  const data = await retryWithDelay(async () => {
    const data = await gql(VENTO_SWAP_QUERY_WITH_CURSOR, { address, after: cursor }, goldskyGateway);
    validateGqlResponse(data);
    return data.data;
  }, 2);

  const edges = data?.transactions?.edges || [];
  if (edges.length === 0) return { txs: [], hasNextPage: false, cursor };

  // Update cursor and next page info
  cursor = edges[edges.length - 1].cursor;
  const hasNextPage = data?.transactions?.pageInfo?.hasNextPage || false;

  // Categorize transactions and build maps
  const txMap = new Map<string, GQLEdgeInterface>();
  const burnTxIds: string[] = [];
  const transferTxIds: string[] = [];

  edges.forEach((edge) => {
    txMap.set(edge.node.id, edge);

    const actionTag = edge.node.tags.find((tag) => tag.name === "Action");
    if (actionTag) {
      if (actionTag.value === "Burn") {
        burnTxIds.push(edge.node.id);
      } else if (actionTag.value === "BridgeARToVAR") {
        transferTxIds.push(edge.node.id);
      }
    }
  });

  // Get debit notice data for burn transactions
  const debitNoticeData = await retryWithDelay(async () => {
    const data = await gql(VENTO_BURN_DEBIT_NOTICE_QUERY, { pushedFors: burnTxIds }, goldskyGateway);
    validateGqlResponse(data);
    return data.data;
  }, 2);

  // Map debit notices to burn transactions
  const debitBurnMap = new Map(
    (debitNoticeData?.transactions?.edges || []).map((edge) => [
      edge.node.id,
      getTagValue("Pushed-For", edge.node.tags),
    ]),
  );

  // Get bridge transaction details
  const txIds = [...debitBurnMap.keys(), ...transferTxIds];
  const results = await Promise.allSettled(
    txIds.map((txId) => getVentoBridgeTransaction(txId, debitBurnMap.has(txId))),
  );

  // Process results and build final transaction list
  const finalEdges = results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === "fulfilled")
    .map((result) => {
      const tx = result.value;
      const swapTx = txMap.get(debitBurnMap.get(tx.txId) || tx.txId);

      if (!swapTx) return null;

      swapTx.node.tags.push(
        { name: "Bridge-Status", value: tx.status },
        { name: "To-Quantity", value: tx.outputAmountRaw },
        { name: "OrderStatus", value: tx.failureReason || tx.status === "failed" ? "Error" : "Swapped" },
      );

      return swapTx;
    })
    .filter(Boolean);

  const parsedTransactions = finalEdges.map(parseSwapTransaction).filter(Boolean);
  return { txs: parsedTransactions, hasNextPage, cursor };
}

export const AOX_BRIDGE_TOKEN_IDS = new Set<string>([AR_PROCESS_ID, WAR_PROCESS_ID]);
export const VENTO_BRIDGE_TOKEN_IDS = new Set<string>([AR_PROCESS_ID, VAR_PROCESS_ID]);

export const isAoxBridgeTokenPair = (tokenIn: string, tokenOut: string) =>
  AOX_BRIDGE_TOKEN_IDS.has(tokenIn) && AOX_BRIDGE_TOKEN_IDS.has(tokenOut);

export const isVentoBridgeTokenPair = (tokenIn: string, tokenOut: string) =>
  VENTO_BRIDGE_TOKEN_IDS.has(tokenIn) && VENTO_BRIDGE_TOKEN_IDS.has(tokenOut);
