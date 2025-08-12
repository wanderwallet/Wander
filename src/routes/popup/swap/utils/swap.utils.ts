import type { TokenInfo } from "~tokens/aoTokens/ao";
import type { BotegaPool, PermaswapPool, Pool } from "./swap.types";

const BOTEGA_POOL_OPTIONS = {
  headers: {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    authorization:
      "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6bXpuaWFnc2ZjZm5oZ3Nqa3B2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0MjI5NDEsImV4cCI6MjA2Mzk5ODk0MX0.IjB7j34CjhqUXQcO_dKM_9k3okmSomSpu9dtyPV2agU",
    "content-type": "application/json",
  },
  body: "{}",
  method: "POST",
};

export async function getBotegaPools() {
  const response = await fetch("https://kzmzniagsfcfnhgsjkpv.supabase.co/functions/v1/pools", BOTEGA_POOL_OPTIONS);
  const pools = (await response.json()) as BotegaPool[];

  const structuredPools = pools.map((pool) => ({
    poolId: pool.amm_process,
    poolName: pool.amm_name,
    poolFee: String(pool.pool_fee_bps),
    poolType: "botega",
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

export async function getPermaswapPools() {
  const response = await fetch("https://api-ffpscan.permaswap.network/pools");
  const pools = (await response.json()) as PermaswapPool[];

  const structuredPools = pools.map((pool) => ({
    poolId: pool.process,
    poolName: pool.name,
    poolFee: String(pool.fee),
    poolType: "permaswap",
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

export async function getPools() {
  const promises = await Promise.allSettled([getBotegaPools(), getPermaswapPools()]);

  const botegaPools = promises[0].status === "fulfilled" ? promises[0].value : [];
  const permaswapPools = promises[1].status === "fulfilled" ? promises[1].value : [];

  return [...botegaPools, ...permaswapPools].filter(
    (pool) => +pool.tokenXDenomination >= 0 && +pool.tokenYDenomination >= 0 && pool.tokenXTicker && pool.tokenYTicker,
  );
}

export const processToken = (uniqueTokens: Map<string, TokenInfo>, tokenId: string, tokenData: TokenInfo) => {
  if (!uniqueTokens.has(tokenId)) {
    uniqueTokens.set(tokenId, tokenData);
  } else if (tokenData.Logo && !uniqueTokens.get(tokenId)?.Logo) {
    const existingToken = uniqueTokens.get(tokenId);
    uniqueTokens.set(tokenId, { ...existingToken, Logo: tokenData.Logo });
  }
};
