import {
  createDataItemKeystoneSigner,
  createDataItemSigner,
  getTagValue,
  getTagValueMap,
  type TokenInfo,
} from "~tokens/aoTokens/ao";
import {
  type SwapData,
  type BotegaPool,
  type BotegaPoolOverview,
  type ParsedSwapTransaction,
  type PermaswapPool,
  type Pool,
  type PoolType,
  type Provider,
  type SelectedPoolInfo,
} from "./swap.types";
import BigNumber from "bignumber.js";
import { BOTEGA_API_KEY, BOTEGA_SUPABASE_URL } from "./data-source/data-source.constants";
import {
  AR_PROCESS_ID,
  AR_TOKEN_INFO,
  VAR_PROCESS_ID,
  VAR_TOKEN_INFO,
  WAR_PROCESS_ID,
  WAR_TOKEN_INFO,
} from "~tokens/aoTokens/ao.constants";
import { PoolTypeEnum, WANDER_FEE_RECIPIENT } from "./swap.constants";
import type { DefaultTheme } from "styled-components";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type GQLResultInterface from "ar-gql/dist/faces";
import { retryWithDelay } from "~utils/promises/retry";
import { gql } from "~gateways/api";
import { goldskyGateway } from "~gateways/gateway";
import { SWAP_CONFIRMATION_QUERY, SWAP_TX_AO_QUERY, SWAP_TX_QUERY } from "./dex/dex.constants";
import { createStorageArray } from "./storage/storage.array";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { aox } from "./bridge/bridge.aox";
import { botega } from "./dex/dex.botega";
import { permaswap } from "./dex/dex.permaswap";
import { vento } from "./bridge/bridge.vento";
import type { GetExpectedOutputParams, ReadSwapResult, SwapExecutionParams } from "./dex/dex.types";
import { getAoxBridgeTransaction, getVentoBridgeTransaction } from "./bridge/bridge.utils";
import { getLinkedMessages } from "./dex/dex.utils";
import { createData, DataItem, type Tag } from "@dha-team/arbundles";
import type Transaction from "arweave/web/lib/transaction";
import browser from "webextension-polyfill";
import { generateAnchor, KeystoneSigner } from "~wallets/hardware/keystone";
import { retryWithGateways } from "~gateways/wayfinder";
import Arweave from "arweave/web/common";
import { connect } from "@permaweb/aoconnect";
import { defaultConfig } from "~tokens/aoTokens/config";
import type { DecodedTag } from "~api/modules/sign/tags";

const aoInstance = connect(defaultConfig);

const BOTEGA_POOL_OPTIONS = {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    authorization: `Bearer ${BOTEGA_API_KEY}`,
    "content-type": "application/json",
  },
  body: "{}",
  method: "POST",
};

export async function getBotegaPools() {
  const [poolsResponse, poolsOverviewResponse] = await Promise.allSettled([
    getBotegaGlobalLiquidity(),
    getBotegaPoolsOverview(),
  ]);

  const pools = poolsResponse.status === "fulfilled" ? poolsResponse.value : [];
  const poolsOverview = poolsOverviewResponse.status === "fulfilled" ? poolsOverviewResponse.value : [];

  // Create a map of pool process ID to liquidity for quick lookup
  const liquidityMap = new Map(poolsOverview.map((pool) => [pool.amm_process, +pool.liquidity_usd || 0]));

  // Sort pools by liquidity_usd from poolsOverview
  return pools.sort((a, b) => {
    const liquidityA = liquidityMap.get(a.poolId) || 0;
    const liquidityB = liquidityMap.get(b.poolId) || 0;
    return liquidityB - liquidityA; // Sort in descending order
  });
}

export async function getBotegaGlobalLiquidity() {
  const response = await fetch(`${BOTEGA_SUPABASE_URL}/functions/v1/pools`, BOTEGA_POOL_OPTIONS);
  const pools = (await response.json()) as BotegaPool[];

  const structuredPools = pools.map((pool) => ({
    poolId: pool.amm_process,
    poolName: pool.amm_name,
    poolFee: String(pool.pool_fee_bps),
    poolType: PoolTypeEnum.BOTEGA,
    tokenX: pool.token0,
    tokenY: pool.token1,
    tokenXDenomination: pool.token0_denominator,
    tokenYDenomination: pool.token1_denominator,
    tokenXTicker: pool.token0_ticker,
    tokenYTicker: pool.token1_ticker,
    tokenXName: pool.token0_name,
    tokenYName: pool.token1_name,
    tokenXLogo: "",
    tokenYLogo: "",
  })) satisfies Pool[];

  return structuredPools;
}

export async function getBotegaPoolsOverview() {
  const response = await fetch(`${BOTEGA_SUPABASE_URL}/functions/v1/overview`, BOTEGA_POOL_OPTIONS);
  const poolsOverview = (await response.json()) as BotegaPoolOverview[];

  return poolsOverview;
}

export async function getPermaswapPools() {
  const response = await fetch("https://api-ffpscan.permaswap.network/pools");
  const pools = (await response.json()) as PermaswapPool[];

  const structuredPools = pools
    .sort((a, b) => +b.px - +a.px && +b.py - +a.py)
    .map((pool) => ({
      poolId: pool.process,
      poolName: pool.name,
      poolFee: String(pool.fee),
      poolType: PoolTypeEnum.PERMASWAP,
      tokenXReserve: pool.px,
      tokenYReserve: pool.py,
      tokenX: pool.x,
      tokenY: pool.y,
      tokenXDenomination: pool.decimalX,
      tokenYDenomination: pool.decimalY,
      tokenXTicker: pool.symbolX,
      tokenYTicker: pool.symbolY,
      tokenXName: pool.fullNameX,
      tokenYName: pool.fullNameY,
      tokenXLogo: pool.logoX,
      tokenYLogo: pool.logoY,
    })) satisfies Pool[];

  return structuredPools;
}

// Mimic other pools
export async function getAoxPools() {
  return [
    {
      poolId: "AR-WAR",
      poolName: "AR/WAR",
      poolFee: "0",
      poolType: PoolTypeEnum.AOX,
      tokenXReserve: "0",
      tokenYReserve: "0",
      tokenX: AR_PROCESS_ID,
      tokenY: WAR_PROCESS_ID,
      tokenXDenomination: AR_TOKEN_INFO.Denomination,
      tokenYDenomination: WAR_TOKEN_INFO.Denomination,
      tokenXTicker: AR_TOKEN_INFO.Ticker,
      tokenYTicker: WAR_TOKEN_INFO.Ticker,
      tokenXName: AR_TOKEN_INFO.Name,
      tokenYName: WAR_TOKEN_INFO.Name,
      tokenXLogo: AR_TOKEN_INFO.Logo,
      tokenYLogo: WAR_TOKEN_INFO.Logo,
    },
  ] satisfies Pool[];
}

// Mimic other pools
export async function getVentoPools() {
  return [
    {
      poolId: "AR-VAR",
      poolName: "AR/VAR",
      poolFee: "1",
      poolType: PoolTypeEnum.VENTO,
      tokenXReserve: "0",
      tokenYReserve: "0",
      tokenX: AR_PROCESS_ID,
      tokenY: VAR_PROCESS_ID,
      tokenXDenomination: AR_TOKEN_INFO.Denomination,
      tokenYDenomination: VAR_TOKEN_INFO.Denomination,
      tokenXTicker: AR_TOKEN_INFO.Ticker,
      tokenYTicker: VAR_TOKEN_INFO.Ticker,
      tokenXName: AR_TOKEN_INFO.Name,
      tokenYName: VAR_TOKEN_INFO.Name,
      tokenXLogo: AR_TOKEN_INFO.Logo,
      tokenYLogo: VAR_TOKEN_INFO.Logo,
    },
  ] satisfies Pool[];
}

export async function getPools() {
  const promises = await Promise.allSettled([getBotegaPools(), getPermaswapPools(), getAoxPools(), getVentoPools()]);

  const botegaPools = promises[0].status === "fulfilled" ? promises[0].value : [];
  const permaswapPools = promises[1].status === "fulfilled" ? promises[1].value : [];
  const aoxPools = promises[2].status === "fulfilled" ? promises[2].value : [];
  const ventoPools = promises[3].status === "fulfilled" ? promises[3].value : [];

  return [...aoxPools, ...ventoPools, ...botegaPools, ...permaswapPools].filter(
    (pool) => +pool.tokenXDenomination >= 0 && +pool.tokenYDenomination >= 0 && pool.tokenXTicker && pool.tokenYTicker,
  );
}

export const processToken = (uniqueTokens: Map<string, TokenInfo>, tokenData: TokenInfo) => {
  const tokenId = tokenData.processId;

  if (!uniqueTokens.has(tokenId)) {
    uniqueTokens.set(tokenId, tokenData);
  } else if (tokenData.Logo && !uniqueTokens.get(tokenId)?.Logo) {
    const existingToken = uniqueTokens.get(tokenId);
    uniqueTokens.set(tokenId, { ...existingToken, Logo: tokenData.Logo });
  }
};

/**
 * Calculate price impact for a swap
 * @param reserveIn - Reserve amount of input token (as string)
 * @param reserveOut - Reserve amount of output token (as string)
 * @param amountIn - Amount being swapped in (as string)
 * @returns Price impact as a percentage string
 */
export function getPriceImpact(reserveIn: string, reserveOut: string, amountIn: string): string {
  // Convert all values to BigNumber for precise calculations
  const reserveInBN = new BigNumber(reserveIn);
  const reserveOutBN = new BigNumber(reserveOut);
  const amountInBN = new BigNumber(amountIn);

  // Calculate constant product (K = x * y)
  const K = reserveInBN.multipliedBy(reserveOutBN);

  // Calculate output amount using constant product formula
  // out = y - (K / (x + dx))
  const amountOut = reserveOutBN.minus(K.dividedBy(reserveInBN.plus(amountInBN)));

  // Calculate old price (y / x)
  const oldPrice = reserveOutBN.dividedBy(reserveInBN);

  // Calculate new price ((y - out) / (x + dx))
  const newPrice = reserveOutBN.minus(amountOut).dividedBy(reserveInBN.plus(amountInBN));

  if (oldPrice.isZero()) return "0";

  // Calculate price impact: ((newPrice - oldPrice) / oldPrice) * 100
  const priceImpact = newPrice.minus(oldPrice).multipliedBy(100).dividedBy(oldPrice);

  // Return percentage with 2 decimal places
  const result = priceImpact.toFixed(2);
  return result === "-0.00" || result === "NaN" ? "0.00" : result;
}

export function getProviderName(poolType: PoolType) {
  switch (poolType) {
    case PoolTypeEnum.BOTEGA:
      return "Botega";
    case PoolTypeEnum.PERMASWAP:
      return "Permaswap";
    case PoolTypeEnum.AOX:
      return "AOX";
    case PoolTypeEnum.VENTO:
      return "Vento";
    default:
      return "";
  }
}

export function getSwapTime(poolType: PoolType | Provider) {
  if (!poolType) return "15s";
  const poolTypeLower = poolType.toLowerCase();
  if (poolTypeLower === PoolTypeEnum.AOX || poolTypeLower === PoolTypeEnum.VENTO) return "30-60m";
  return "15s";
}

export function getPriceImpactColor(priceImpact: string, theme: DefaultTheme) {
  const impact = +priceImpact;
  if (!impact || Number.isNaN(impact)) return theme.primaryText;
  return impact > 0 ? theme.success : impact <= -10 ? theme.fail : theme.primaryText;
}

export function toFixed(value: any, decimals: number, roundingMode: BigNumber.RoundingMode = BigNumber.ROUND_DOWN) {
  const valueBN = value instanceof BigNumber ? value : BigNumber(value);
  if (valueBN.isNaN()) return value;
  return valueBN.toFixed(decimals, roundingMode).replace(/\.?0*$/, "");
}

export function parseSwapTransaction(transaction: GQLEdgeInterface): ParsedSwapTransaction {
  try {
    const { node } = transaction;
    const tags = node.tags || [];

    const tagValueMap = getTagValueMap(tags);

    // Helper function for efficient tag access
    const getTagValue = (name: string): string => tagValueMap.get(name) || "";

    // Parse basic transaction data
    // @ts-ignore
    const blockTimestamp = node.block?.timestamp || node?.ingested_at;
    const timestamp = blockTimestamp ? blockTimestamp * 1000 : Date.now();
    const pushedFor = getTagValue("Pushed-For");
    const txId = pushedFor || node.id;
    const isAo = getTagValue("Data-Protocol") === "ao";

    // Parse transaction state
    const action = getTagValue("Action");
    const orderStatus = getTagValue("OrderStatus");
    const bridgeStatus = getTagValue("Bridge-Status");

    // Parse transaction details
    const rate = getTagValue("X-Rate");
    const provider = getTagValue("X-Provider") as Provider;
    const networkProviderFee = getTagValue("X-Provider-Network-Fee") || getTagValue("X-Network-Fee");
    const wanderFee = getTagValue("X-Client-Fee");
    const slippage = getTagValue("X-Slippage");
    const priceImpact = getTagValue("X-Price-Impact");
    const amountIn = getTagValue("X-Amount-In");
    const amountOut =
      getTagValue("To-Quantity") || getTagValue("AmountOut") || getTagValue("Quantity") || getTagValue("X-Amount-Out");

    const tokenIn = JSON.parse(getTagValue("X-Token-In"));
    const tokenOut = JSON.parse(getTagValue("X-Token-Out"));

    const isError = action === "Order-Error" || (orderStatus && orderStatus !== "Swapped");
    const isPending = orderStatus === "Pending" || (bridgeStatus && !["success", "filled"].includes(bridgeStatus));
    const status = isError ? "Failed" : isPending ? "Pending" : "Completed";

    return {
      txId,
      isAo,
      rate,
      timestamp,
      provider,
      networkProviderFee,
      wanderFee,
      slippage,
      priceImpact,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      status,
    };
  } catch (err) {
    log(LOG_GROUP.SWAP, "parseSwapTransaction failed", { err, tx: transaction });
  }
}

export function validateGqlResponse(data: GQLResultInterface) {
  if (data?.data === null && (data as any)?.errors?.length > 0) {
    throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
  }
}

export function getStatusColor(status: ParsedSwapTransaction["status"]) {
  switch (status) {
    case "Pending":
      return "#FFE342";
    case "Failed":
      return "#EE5A4F";
    case "Completed":
      return "#04AA3E";
    default:
      return "#04AA3E";
  }
}

export async function getSwapTransaction(txId: string) {
  const result = await retryWithDelay(async (attempt) => {
    const swapQuery = attempt % 2 === 0 ? SWAP_TX_QUERY : SWAP_TX_AO_QUERY;
    const response = await gql(swapQuery, { txId }, goldskyGateway);

    // validate the response
    validateGqlResponse(response);

    const tx = response?.data?.transactions?.edges[0];
    const tags = tx.node.tags;
    const provider = getTagValue("X-Provider", tags);
    if (provider !== "AOX" && provider !== "Vento") {
      const confirmationResponse = await gql(SWAP_CONFIRMATION_QUERY, { pushedFor: txId }, goldskyGateway);

      // validate the response
      validateGqlResponse(confirmationResponse);

      const confirmationTx = confirmationResponse?.data?.transactions?.edges[0];
      const confirmationTags = confirmationTx.node.tags;
      tx.node.tags.push(
        ...[
          {
            name: "OrderStatus",
            value: getTagValue("OrderStatus", confirmationTags),
          },
          {
            name: "Action",
            value: getTagValue("Action", confirmationTags),
          },
          {
            name: "Quantity",
            value: getTagValue("Quantity", confirmationTags),
          },
          {
            name: "To-Quantity",
            value: getTagValue("To-Quantity", confirmationTags),
          },
          {
            name: "AmountOut",
            value: getTagValue("AmountOut", confirmationTags),
          },
        ],
      );
    } else {
      if (provider === "AOX") {
        const confirmationTx = await getAoxBridgeTransaction(txId);
        tx.node.tags.push(
          ...[
            { name: "Bridge-Status", value: confirmationTx.status },
            { name: "To-Quantity", value: confirmationTx.quantity },
          ],
        );
      } else {
        const isAo = getTagValue("Data-Protocol", tags) === "ao";
        const isBurn = getTagValue("Action", tags) === "Burn";
        let finalTxId = txId;
        if (isBurn) {
          const messages = await getLinkedMessages(undefined, undefined, false, txId);
          const debitNotice = messages.find((msg) => msg.tags["Action"] === "Debit-Notice");
          finalTxId = debitNotice?.id || txId;
        }
        const confirmationTx = await getVentoBridgeTransaction(finalTxId, isAo);
        tx.node.tags.push(
          ...[
            { name: "Bridge-Status", value: confirmationTx.status },
            { name: "To-Quantity", value: confirmationTx.outputAmountRaw },
            {
              name: "OrderStatus",
              value: confirmationTx.failureReason || confirmationTx.status === "failed" ? "Error" : "Swapped",
            },
          ],
        );
      }
    }

    return tx;
  }, 2);

  return parseSwapTransaction(result);
}

export const swapsArray = createStorageArray<SwapData>("swaps", {
  preventDuplicates: true,
  uniqueKey: "transferId",
});

const getSwapStatus = (status?: string): ParsedSwapTransaction["status"] => {
  switch (status) {
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
};

export function calculateRate(
  selectedPoolInfo: SelectedPoolInfo,
  sendToken: TokenInfo,
  receiveToken: TokenInfo,
  amountIn: string,
): string {
  if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken || !amountIn) return "--";

  const valueIn = BigNumber(amountIn).shiftedBy(-sendToken.Denomination);
  const valueOut = BigNumber(selectedPoolInfo.quoteOutput.amountOut || "0").shiftedBy(-receiveToken.Denomination);

  const valueOutForUnitValueIn = valueOut.dividedBy(valueIn);
  return `1 ${sendToken.Ticker} ≈ ${toFixed(valueOutForUnitValueIn, 8)} ${receiveToken.Ticker}`;
}

export function calculateNetworkProviderFee(
  selectedPoolInfo: SelectedPoolInfo,
  sendToken: TokenInfo,
  receiveToken: TokenInfo,
  networkFee: string,
): string {
  if (!selectedPoolInfo?.quoteOutput || !sendToken || !receiveToken) return "--";

  let tokenInFee = BigNumber(selectedPoolInfo.quoteOutput.tokenInFee || "0");
  let tokenOutFee = BigNumber(selectedPoolInfo.quoteOutput.tokenOutFee || "0");

  if (selectedPoolInfo.poolType === "aox" || selectedPoolInfo.poolType === "vento") {
    if (sendToken.processId === AR_PROCESS_ID) {
      tokenInFee = tokenInFee.plus(networkFee);
    } else {
      tokenOutFee = tokenOutFee.plus(networkFee);
    }
  }

  const formatFee = (amount: BigNumber, token: TokenInfo) =>
    `${toFixed(amount.shiftedBy(-token.Denomination), 8)} ${token.Ticker}`;

  if (tokenInFee.isZero() && tokenOutFee.isZero()) {
    return `0 ${sendToken.Ticker}`;
  }

  const fees = [];
  if (!tokenInFee.isZero()) {
    fees.push(formatFee(tokenInFee, sendToken));
  }

  if (!tokenOutFee.isZero()) {
    fees.push(formatFee(tokenOutFee, receiveToken));
  }

  return fees.join(" + ");
}

/**
 * Converts SwapData to ParsedSwapTransaction format
 * This allows stored swap data to be displayed in the same format as fetched transactions
 *
 * @param swapData - The SwapData object to convert
 * @returns ParsedSwapTransaction - Formatted transaction object compatible with UI components
 */
export function convertSwapDataToParsedTransaction(swapData: SwapData): ParsedSwapTransaction {
  const {
    selectedPoolInfo,
    sendToken,
    receiveToken,
    wanderFee,
    slippage,
    amountIn,
    timestamp,
    status,
    networkFee = "0",
  } = swapData;
  const { quoteOutput, priceImpact, poolType } = selectedPoolInfo;

  return {
    txId: swapData.transferId || `swap-${timestamp || Date.now()}`,
    isAo: sendToken.processId !== AR_PROCESS_ID,
    rate: calculateRate(selectedPoolInfo, sendToken, receiveToken, amountIn),
    timestamp: timestamp || Date.now(),
    provider: getProviderName(poolType) || "Botega",
    networkProviderFee: calculateNetworkProviderFee(selectedPoolInfo, sendToken, receiveToken, networkFee),
    wanderFee: wanderFee?.finalFee || "0",
    slippage: slippage.toString(),
    priceImpact: priceImpact || "0",
    tokenIn: sendToken,
    tokenOut: receiveToken,
    amountIn: amountIn || "0",
    amountOut: quoteOutput?.amountOut || "0",
    status: getSwapStatus(status),
  };
}

/**
 * Converts an array of SwapData to ParsedSwapTransaction array
 * Filters out invalid entries and sorts by timestamp (newest first)
 */
export function convertSwapsArrayToParsedTransactions(swaps: SwapData[], swapper: string): ParsedSwapTransaction[] {
  return swaps
    .filter((swap) => swap && swap.selectedPoolInfo && swap.sendToken && swap.receiveToken && swap.swapper === swapper)
    .map(convertSwapDataToParsedTransaction)
    .sort(sortTransactionsByTimestamp);
}

export function executeSwapFn(poolType: PoolType, params: SwapExecutionParams) {
  switch (poolType) {
    case PoolTypeEnum.BOTEGA:
      return botega.executeSwap(params);
    case PoolTypeEnum.PERMASWAP:
      return permaswap.executeSwap(params);
    case PoolTypeEnum.AOX:
      return aox.executeSwap(params);
    case PoolTypeEnum.VENTO:
      return vento.executeSwap(params);
  }
}

export function waitForSwapResultFn(poolType: PoolType, params: ReadSwapResult) {
  switch (poolType) {
    case PoolTypeEnum.BOTEGA:
      return botega.waitForSwapResult(params);
    case PoolTypeEnum.PERMASWAP:
      return permaswap.waitForSwapResult(params);
    case PoolTypeEnum.AOX:
      return aox.waitForSwapResult(params);
    case PoolTypeEnum.VENTO:
      return vento.waitForSwapResult(params);
  }
}

export function getExpectedOutputFn(poolType: PoolType, params: GetExpectedOutputParams) {
  switch (poolType) {
    case PoolTypeEnum.BOTEGA:
      return botega.getExpectedOutput(params);
    case PoolTypeEnum.PERMASWAP:
      return permaswap.getExpectedOutput(params);
    case PoolTypeEnum.AOX:
      return aox.getExpectedOutput(params);
    case PoolTypeEnum.VENTO:
      return vento.getExpectedOutput(params);
  }
}

export function readSwapResultFn(poolType: PoolType, params: ReadSwapResult) {
  switch (poolType) {
    case PoolTypeEnum.BOTEGA:
      return botega.readSwapResult(params);
    case PoolTypeEnum.PERMASWAP:
      return permaswap.readSwapResult(params);
    case PoolTypeEnum.AOX:
      return aox.readSwapResult(params);
    case PoolTypeEnum.VENTO:
      return vento.readSwapResult(params);
  }
}

/**
 * Converts human-readable string (e.g. "1.5") to base units (wei or token smallest unit)
 * @param value - Human-readable string/number (e.g. "1.5" or 1.5)
 * @param denomination - Denomination of the token (e.g. 12 for WAR)
 * @param returnType - Return type: "BigNumber" or "string" (default: "string")
 * @returns Base units as string or BigNumber based on returnType. Returns "0" for invalid or negative values.
 */
export function toTokenBaseUnits<T extends "BigNumber" | "string" = "string">(
  value: string | number | BigNumber,
  denomination: string | number,
  returnType?: T,
): T extends "BigNumber" ? BigNumber : string {
  value = value || "0";
  const denomNum = Number(denomination) || 0;

  const valueBN = value instanceof BigNumber ? value : BigNumber(value);

  // Return "0" for invalid or negative values instead of throwing errors
  if (valueBN.isNaN() || valueBN.isNegative()) {
    const zeroBN = BigNumber(0);
    return (returnType === "BigNumber" ? zeroBN : zeroBN.toFixed(0)) as T extends "BigNumber" ? BigNumber : string;
  }

  const shiftedValue = valueBN.shiftedBy(denomNum);

  return (
    returnType === "BigNumber" ? shiftedValue : shiftedValue.toFixed(0, BigNumber.ROUND_DOWN)
  ) as T extends "BigNumber" ? BigNumber : string;
}

/**
 * Converts from base units to human-readable value
 * @param units - Base units (e.g. "1500000000000000000")
 * @param denomination - Denomination of the token (e.g. 12 for WAR)
 * @param returnType - Return type: "BigNumber" or "string" (default: "string")
 * @returns Human-readable value as string or BigNumber based on returnType. Returns "0" for invalid or negative values.
 */
export function fromTokenBaseUnits<T extends "BigNumber" | "string" = "string">(
  units: string | number | BigNumber,
  denomination: string | number,
  returnType?: T,
): T extends "BigNumber" ? BigNumber : string {
  units = units || "0";
  const denomNum = Number(denomination) || 0;

  const unitsBN = units instanceof BigNumber ? units : BigNumber(units);

  // Return "0" for invalid or negative values instead of throwing errors
  if (unitsBN.isNaN() || unitsBN.isNegative()) {
    const zeroBN = BigNumber(0);
    return (returnType === "BigNumber" ? zeroBN : zeroBN.toFixed()) as T extends "BigNumber" ? BigNumber : string;
  }

  const shiftedValue = unitsBN.shiftedBy(-denomNum);

  return (returnType === "BigNumber" ? shiftedValue : shiftedValue.toFixed()) as T extends "BigNumber"
    ? BigNumber
    : string;
}

export function getFeeTransactionTags(swapId: string, isAo: boolean) {
  const tags = [
    { name: "Fee-Type", value: "Swap" },
    { name: "Swap-Tx-Id", value: swapId || "" },
    { name: "Client", value: "Wander" },
    { name: "Client-Version", value: browser.runtime.getManifest().version },
  ];

  if (!isAo) {
    tags.unshift({ name: "Type", value: "Transfer" });
  }

  return tags;
}

export async function createKeystoneFeeTransaction<P extends PoolType, T extends string>(
  poolType: P,
  tokenIn: T,
  swapId: string,
  feeAmount: string,
  signer: KeystoneSigner,
): Promise<P extends "aox" | "vento" ? (T extends typeof AR_PROCESS_ID ? Transaction : DataItem) : DataItem> {
  const isARSwap = (poolType === "aox" || poolType === "vento") && tokenIn === AR_PROCESS_ID;

  const additionalTags = getFeeTransactionTags(swapId, !isARSwap);

  if (isARSwap) {
    const { result: transaction } = await retryWithGateways((arweave) =>
      arweave.createTransaction({
        target: WANDER_FEE_RECIPIENT,
        quantity: feeAmount,
      }),
    );

    additionalTags.forEach((tag) => transaction.addTag(tag.name, tag.value));

    const result = await signer.signTransaction(transaction);
    const publicKey = Arweave.utils.bufferTob64Url(signer.publicKey);
    transaction.setSignature({ ...result, owner: publicKey });
    return transaction as any;
  } else {
    const tags = [
      { name: "Variant", value: "ao.TN.1" },
      { name: "Type", value: "Message" },
      { name: "Data-Protocol", value: "ao" },
      { name: "SDK", value: "aoconnect" },
      { name: "Content-Type", value: "text/plain" },
      { name: "Action", value: "Transfer" },
      { name: "Recipient", value: WANDER_FEE_RECIPIENT },
      { name: "Quantity", value: feeAmount },
      ...additionalTags,
    ];

    const anchor = generateAnchor() as unknown as string;
    const data = Math.floor(1000 + Math.random() * 9000).toString();
    const dataItem = createData(data, signer, { tags, target: tokenIn, anchor });
    const dataItemBuf = dataItem.getRaw();
    const signature = await signer.sign(dataItemBuf);
    dataItem.setSignature(Buffer.from(signature));
    return dataItem as any;
  }
}

interface CreateAoMessageArgs {
  poolType: PoolType;
  process: string;
  signer: ReturnType<typeof createDataItemSigner> | ReturnType<typeof createDataItemKeystoneSigner>;
  tags: Tag[];
  wanderFee: string;
  keystoneSigner?: KeystoneSigner;
}

export async function createSwapMessage({
  poolType,
  process,
  signer,
  tags,
  wanderFee,
  keystoneSigner,
}: CreateAoMessageArgs) {
  let dataItemRaw: Buffer;
  let keystoneTx: SwapData["keystoneTx"] | undefined;
  const isKeystoneSigner = !!keystoneSigner;
  const hasWanderFee = +wanderFee > 0;
  if (isKeystoneSigner && hasWanderFee) {
    const updatedTags = [
      { name: "Variant", value: "ao.TN.1" },
      { name: "Type", value: "Message" },
      { name: "Data-Protocol", value: "ao" },
      { name: "SDK", value: "aoconnect" },
      { name: "Content-Type", value: "text/plain" },
      ...tags,
    ];
    const data = Math.floor(1000 + Math.random() * 9000).toString();
    const { id, raw } = await signer({ data, tags: updatedTags, target: process });
    dataItemRaw = Buffer.from(raw);

    const feeTx = await createKeystoneFeeTransaction(poolType, process, id, wanderFee, keystoneSigner);
    keystoneTx = { raw: feeTx.getRaw().toString("base64") };
  }

  async function sendMessage() {
    if (isKeystoneSigner && hasWanderFee) {
      try {
        const response = await fetch("https://mu.ao-testnet.xyz", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            Accept: "application/json",
          },
          redirect: "follow",
          // @ts-ignore
          body: dataItemRaw,
        });
        if (!response.ok) throw new Error("Failed to post transaction");
        const result = await response.json();
        return result.id;
      } catch (err) {
        if (err?.name === "RedirectRequested") {
          throw err;
        } else {
          throw new Error(`Error while communicating with MU: ${JSON.stringify(err)}`);
        }
      }
    } else {
      const transferId = await aoInstance.message({ process, signer, tags });
      return transferId;
    }
  }

  // If there is a keystone signer but no wander fee, set the keystoneTx to an empty object
  // since there's no fee to send
  keystoneTx = isKeystoneSigner && !hasWanderFee ? {} : keystoneTx;

  return { keystoneTx, sendMessage };
}

/**
 * Asserts that a transfer result contains valid Credit/Debit notice tags
 * @param message - The message ID of the transfer
 * @param process - The process ID of the transfer
 * @throws {Error} If the transfer result is missing valid notice tags
 */
export async function assertTransferResult(
  message: string,
  process: string,
  validTags = ["Credit-Notice", "Debit-Notice"],
  errorMessage = "Failed to transfer tokens",
) {
  let transferError = "";

  try {
    const { Error, Messages } = await aoInstance.result({ message, process });
    if (Error) {
      transferError = errorMessage;
    } else if (Messages.length > 0) {
      const hasValidTag = Messages.some((message) =>
        message?.Tags?.some((tag: DecodedTag) => tag.name === "Action" && validTags.includes(tag.value)),
      );

      if (!hasValidTag) {
        transferError = errorMessage;
      }
    }
  } catch {}

  if (transferError) {
    log(LOG_GROUP.SWAP, transferError);
    throw new Error(transferError);
  }
}

export function sortTransactionsByTimestamp(a: ParsedSwapTransaction, b: ParsedSwapTransaction) {
  const timestampA = a.timestamp || Number.MAX_SAFE_INTEGER;
  const timestampB = b.timestamp || Number.MAX_SAFE_INTEGER;
  return timestampB - timestampA;
}
