import { getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import {
  type SwapData,
  type BotegaPool,
  type BotegaPoolOverview,
  type ParsedSwapTransaction,
  type PermaswapPool,
  type Pool,
  type PoolType,
  type Provider,
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
import { PoolTypeEnum } from "./swap.constants";
import type { DefaultTheme } from "styled-components";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type GQLResultInterface from "ar-gql/dist/faces";
import { retryWithDelay } from "~utils/promises/retry";
import { gql } from "~gateways/api";
import { goldskyGateway } from "~gateways/gateway";
import { SWAP_CONFIRMATION_QUERY, SWAP_TX_QUERY } from "./dex/dex.constants";
import { createStorageArray } from "./storage/storage.array";
import { log, LOG_GROUP } from "~utils/log/log.utils";
import { aox } from "./bridge/bridge.aox";
import { botega } from "./dex/dex.botega";
import { permaswap } from "./dex/dex.permaswap";
import { vento } from "./bridge/bridge.vento";
import type { GetExpectedOutputParams, SwapExecutionParams } from "./dex/dex.types";
import { getAoxBridgeTransaction, getVentoBridgeTransaction } from "./bridge/bridge.utils";

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

export const AOX_BRIDGE_TOKEN_IDS = new Set<string>([AR_PROCESS_ID, WAR_PROCESS_ID]);
export const VENTO_BRIDGE_TOKEN_IDS = new Set<string>([AR_PROCESS_ID, VAR_PROCESS_ID]);

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
  return priceImpact.toFixed(2);
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
  const priceImpactNumber = +priceImpact;
  if (priceImpactNumber >= 10) return theme.fail;
  if (priceImpactNumber >= 5) return "#EEBD41";
}

export function toFixed(value: any, decimals: number) {
  const valueBN = BigNumber(value);
  if (valueBN.isNaN()) return value;
  return valueBN.decimalPlaces(decimals, BigNumber.ROUND_DOWN).toString();
}

export function parseSwapTransaction(transaction: GQLEdgeInterface): ParsedSwapTransaction {
  try {
    const tags = transaction.node.tags || [];

    const timestamp = transaction.node.block?.timestamp ? transaction.node.block.timestamp * 1000 : Date.now();
    const isAo = getTagValue("Data-Protocol", tags) === "ao";
    const pushedFor = getTagValue("Pushed-For", tags);
    const txId = pushedFor || transaction.node.id;
    const action = getTagValue("Action", tags);
    const orderStatus = getTagValue("OrderStatus", tags);
    const bridgeStatus = getTagValue("Bridge-Status", tags);
    const rate = getTagValue("X-Rate", tags);
    const provider = getTagValue("X-Provider", tags) as Provider;
    const networkFee = getTagValue("X-Network-Fee", tags);
    const wanderFee = getTagValue("X-Client-Fee", tags);
    const slippage = getTagValue("X-Slippage", tags);
    const priceImpact = getTagValue("X-Price-Impact", tags);
    const tokenIn = JSON.parse(getTagValue("X-Token-In", tags));
    const tokenOut = JSON.parse(getTagValue("X-Token-Out", tags));
    const amountIn = getTagValue("X-Amount-In", tags);
    const amountOut =
      getTagValue("To-Quantity", tags) ||
      getTagValue("AmountOut", tags) ||
      getTagValue("Quantity", tags) ||
      getTagValue("X-Amount-Out", tags);

    const error = action === "Order-Error" || (orderStatus && orderStatus !== "Swapped");
    const isPending = bridgeStatus && bridgeStatus !== "success" && bridgeStatus !== "filled";
    const status = error ? "Failed" : isPending ? "Pending" : "Completed";

    return {
      txId,
      isAo,
      rate,
      timestamp,
      provider,
      networkFee,
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
  const result = await retryWithDelay(async () => {
    const response = await gql(SWAP_TX_QUERY, { txId }, goldskyGateway);

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
      tx.node.tags.unshift(
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
        const confirmationTx = await getVentoBridgeTransaction(txId);
        tx.node.tags.push(
          ...[
            { name: "Bridge-Status", value: confirmationTx.status },
            { name: "To-Quantity", value: confirmationTx.outputAmountRaw },
            {
              name: "OrderStatus",
              value: confirmationTx.failureReason && confirmationTx.failureReason !== "" ? "Error" : "Swapped",
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

export function waitForSwapResultFn(poolType: PoolType, transferId: string) {
  switch (poolType) {
    case PoolTypeEnum.BOTEGA:
      return botega.waitForSwapResult(transferId);
    case PoolTypeEnum.PERMASWAP:
      return permaswap.waitForSwapResult(transferId);
    case PoolTypeEnum.AOX:
      return aox.waitForSwapResult(transferId);
    case PoolTypeEnum.VENTO:
      return vento.waitForSwapResult(transferId);
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

/**
 * Converts human-readable string (e.g. "1.5") to base units (wei or token smallest unit)
 * @param value - Human-readable string/number (e.g. "1.5" or 1.5)
 * @param denomination - Denomination of the token (e.g. 12 for WAR)
 * @param returnType - Return type: "BigNumber" or "string" (default: "string")
 * @returns Base units as string or BigNumber based on returnType
 * @throws {Error} When value is invalid or denomination is negative
 */
export function toTokenBaseUnits<T extends "BigNumber" | "string" = "string">(
  value: string | number | BigNumber,
  denomination: string | number,
  returnType?: T,
): T extends "BigNumber" ? BigNumber : string {
  value = value || "0";
  const denomNum = Number(denomination) || 0;

  const valueBN = value instanceof BigNumber ? value : new BigNumber(value);

  if (valueBN.isNaN()) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  if (valueBN.isNegative()) {
    throw new Error(`Value cannot be negative: ${value}`);
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
 * @returns Human-readable value as string or BigNumber based on returnType
 * @throws {Error} When units is invalid or denomination is negative
 */
export function fromTokenBaseUnits<T extends "BigNumber" | "string" = "string">(
  units: string | number | BigNumber,
  denomination: string | number,
  returnType?: T,
): T extends "BigNumber" ? BigNumber : string {
  units = units || "0";
  const denomNum = Number(denomination) || 0;

  const unitsBN = units instanceof BigNumber ? units : new BigNumber(units);

  if (unitsBN.isNaN()) {
    throw new Error(`Invalid numeric units: ${units}`);
  }

  if (unitsBN.isNegative()) {
    throw new Error(`Units cannot be negative: ${units}`);
  }

  const shiftedValue = unitsBN.shiftedBy(-denomNum);

  return (returnType === "BigNumber" ? shiftedValue : shiftedValue.toFixed()) as T extends "BigNumber"
    ? BigNumber
    : string;
}
