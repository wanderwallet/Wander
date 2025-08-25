import { getTagValue, type TokenInfo } from "~tokens/aoTokens/ao";
import type {
  BotegaPool,
  BotegaPoolOverview,
  ParsedSwapTransaction,
  PermaswapPool,
  Pool,
  PoolType,
} from "./swap.types";
import BigNumber from "bignumber.js";
import { BOTEGA_API_KEY, BOTEGA_SUPABASE_URL } from "./data-source/data-source.constants";
import { AR_PROCESS_ID, AR_TOKEN_INFO, WAR_PROCESS_ID, WAR_TOKEN_INFO } from "~tokens/aoTokens/ao.constants";
import { PoolTypeEnum } from "./swap.constants";
import type { DefaultTheme } from "styled-components";
import type { GQLEdgeInterface } from "ar-gql/dist/faces";
import type GQLResultInterface from "ar-gql/dist/faces";

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

export const BRIDGE_TOKEN_IDS = new Set<string>([AR_PROCESS_ID, WAR_PROCESS_ID]);

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
      tokenXDenomination: 12,
      tokenYDenomination: 12,
      tokenXTicker: "AR",
      tokenYTicker: "wAR",
      tokenXName: "Arweave",
      tokenYName: "Wrapped Arweave",
      tokenXLogo: AR_TOKEN_INFO.Logo,
      tokenYLogo: WAR_TOKEN_INFO.Logo,
    },
  ] satisfies Pool[];
}

export async function getPools() {
  const promises = await Promise.allSettled([getBotegaPools(), getPermaswapPools(), getAoxPools()]);

  const botegaPools = promises[0].status === "fulfilled" ? promises[0].value : [];
  const permaswapPools = promises[1].status === "fulfilled" ? promises[1].value : [];
  const aoxPools = promises[2].status === "fulfilled" ? promises[2].value : [];

  return [...botegaPools, ...permaswapPools, ...aoxPools].filter(
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
    default:
      return "";
  }
}

export function getSwapTime(poolType: PoolType) {
  if (poolType === PoolTypeEnum.AOX) return "30-60m";
  return "15s";
}

export function getPriceImpactColor(priceImpact: string, theme: DefaultTheme) {
  const priceImpactNumber = +priceImpact;
  if (priceImpactNumber >= 10) return theme.fail;
  if (priceImpactNumber >= 5) return "#EEBD41";
}

export function toFixed(value: BigNumber, decimals: number) {
  return value.decimalPlaces(decimals, BigNumber.ROUND_DOWN).toString();
}

export function parseSwapTransaction(transaction: GQLEdgeInterface): ParsedSwapTransaction {
  const tags = transaction.node.tags || [];

  const timestamp = transaction.node.block?.timestamp ? transaction.node.block.timestamp * 1000 : Date.now();
  const isAo = getTagValue("Data-Protocol", tags) === "ao";
  const pushedFor = getTagValue("Pushed-For", tags);
  const txId = pushedFor || transaction.node.id;
  const action = getTagValue("Action", tags);
  const orderStatus = getTagValue("OrderStatus", tags);
  const bridgeStatus = getTagValue("Bridge-Status", tags);
  const rate = getTagValue("X-Rate", tags);
  const provider = getTagValue("X-Provider", tags);
  const networkFee = getTagValue("X-Network-Fee", tags);
  const wanderFee = getTagValue("X-Client-Fee", tags);
  const slippage = getTagValue("X-Slippage", tags);
  const priceImpact = getTagValue("X-Price-Impact", tags);
  const tokenIn = JSON.parse(getTagValue("X-Token-In", tags));
  const tokenOut = JSON.parse(getTagValue("X-Token-Out", tags));
  const amountIn = getTagValue("X-Amount-In", tags);
  const amountOut =
    getTagValue("To-Quantity", tags) ||
    getTagValue("Quantity", tags) ||
    getTagValue("AmountOut", tags) ||
    getTagValue("X-Amount-Out", tags);

  const error = action === "Order-Error" || (orderStatus && orderStatus !== "Swapped");
  const isPending = bridgeStatus && bridgeStatus !== "success";
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
}

export function validateGqlResponse(data: GQLResultInterface) {
  if (data?.data === null && (data as any)?.errors?.length > 0) {
    throw new Error((data as any)?.errors?.[0]?.message || "GraphQL Error");
  }
}
