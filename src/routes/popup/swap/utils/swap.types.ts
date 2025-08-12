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

export type PoolType = "botega" | "permaswap";

export interface Pool {
  poolId: string;
  poolName: string;
  poolFee: string;
  poolType: PoolType;
  tokenX: string;
  tokenY: string;
  tokenXDenomination: number;
  tokenYDenomination: number;
  tokenXTicker: string;
  tokenYTicker: string;
  tokenXName: string;
}

export type TokenSelectorType = "send" | "receive";
