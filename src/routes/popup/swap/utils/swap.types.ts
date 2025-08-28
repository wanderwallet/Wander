import type { TokenInfo } from "~tokens/aoTokens/ao";
import type { GetExpectedOutputResponse } from "./dex/dex.types";
import type { Tier } from "~utils/tier/types";

export interface PermaswapPool {
  process: string;
  x: string;
  y: string;
  fee: string;
  symbolX: string;
  symbolY: string;
  decimalX: number;
  decimalY: number;
  fullNameX: string;
  fullNameY: string;
  px: string;
  py: string;
  logoX: string;
  logoY: string;
  totalSupply: string;
  denomination: number;
  poolStatus: string;
  xUsdPrice: string;
  yUsdPrice: string;
  tradeCount24H: number;
  volumeLast24H: string;
  volumeLast7Days: string;
  name: string;
  py_real_up: string;
  py_real_down: string;
  px_real_up: string;
  px_real_down: string;
  pool_type: string;
  low: string;
  high: string;
  factor: string;
  accessible: boolean;
  reverseSymbol: boolean;
}

export type BotegaPool = {
  amm_name: string;
  amm_process: string;
  token0: string;
  token1: string;
  amm_status: string;
  pool_fee_bps: number;
  token0_denominator: number;
  token0_name: string;
  token0_total_supply: string;
  token0_fixed_supply: boolean;
  token0_process: string;
  token0_ticker: string;
  token1_name: string;
  token1_total_supply: string;
  token1_fixed_supply: boolean;
  token1_denominator: number;
  token1_process: string;
  token1_ticker: string;
  amm_discovered_at_ts: number;
};

export type PoolType = "botega" | "permaswap" | "aox" | "vento";
export type Provider = "Botega" | "Permaswap" | "AOX" | "Vento";

export interface Pool {
  poolId: string;
  poolName: string;
  poolFee: string;
  poolType: PoolType;
  tokenXReserve?: string;
  tokenYReserve?: string;
  tokenX: string;
  tokenY: string;
  tokenXDenomination: number;
  tokenYDenomination: number;
  tokenXTicker: string;
  tokenYTicker: string;
  tokenXName: string;
  tokenYName: string;
  tokenXLogo: string;
  tokenYLogo: string;
}

export interface BotegaPoolOverview {
  amm_name: string;
  amm_process: string;
  token0: string;
  token1: string;
  amm_status: string;
  pool_fee_bps: number;
  transactions: number;
  volume: number;
  volume_usd: number;
  token_name: string;
  total_supply: string;
  fixed_supply: boolean;
  token0_denominator: number;
  token0_name: string;
  token0_total_supply: string;
  token0_fixed_supply: boolean;
  token0_process: string;
  token0_ticker: string;
  token1_name: string;
  token1_total_supply: string;
  token1_fixed_supply: boolean;
  token1_denominator: number;
  token1_process: string;
  token1_ticker: string;
  liquidity_usd: number;
  market_cap: number;
  token0_market_cap: number;
  token1_market_cap: number;
  microdexi_process_ids: string;
  token0_current_price: string;
  token0_price_5m_ago: string;
  token0_price_1h_ago: string;
  token0_price_6h_ago: string;
  token0_price_24h_ago: string;
  token1_current_price: string;
  token1_price_5m_ago: string;
  token1_price_1h_ago: string;
  token1_price_6h_ago: string;
  token1_price_24h_ago: string;
  amm_discovered_at_ts: number;
}

export type TokenSelectorType = "send" | "receive";

export interface SelectedPoolInfo {
  pool: Pool;
  quoteOutput: GetExpectedOutputResponse;
  priceImpact: string;
}

export interface WanderFee {
  hasChanged: boolean;
  originalFee: string;
  finalFee: string;
}

export interface SwapData {
  transferId?: string;
  selectedPoolInfo: SelectedPoolInfo;
  sendToken: TokenInfo;
  receiveToken: TokenInfo;
  wanderFee: WanderFee;
  slippage: number;
  amountIn: string;
  swapper: string;
  tier: Tier;
  wanderFeeSent?: boolean;
  analyticsSent?: boolean;
  status?: "pending" | "completed" | "failed";
  timestamp?: number;
  completedAt?: number;
  feeProcessedAt?: number;
  showCompletionScreen?: boolean;
  monitoringStarted?: boolean;
}

export interface TokenPools {
  botega: Pool[];
  permaswap: Pool[];
  aox: Pool[];
  vento: Pool[];
}

export interface ParsedSwapTransaction {
  txId: string;
  isAo: boolean;
  rate: string;
  timestamp: number;
  provider: Provider;
  networkFee: string;
  wanderFee: string;
  slippage: string;
  priceImpact: string;
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  amountOut: string;
  status: "Pending" | "Completed" | "Failed";
}

export interface TokenInfoWithPoolPartners extends TokenInfo {
  poolPartners: Set<string>;
}
