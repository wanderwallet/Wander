import { connect } from "@permaweb/aoconnect";
import { type Tag } from "arweave/web/lib/transaction";

export type PoolLiquidity = {
  amm_base_token: string;
  amm_token0: string;
  amm_quote_token: string;
  amm_name: string;
  amm_process: string;
  reserves_0: string;
  reserves_1: string;
  pool_fee_bps: number;
  amm_status: string;
  amm_discovered_at_ts: number;
  amm_token1: string;
  token_0_decimals: number;
  token_1_decimals: number;
};

export type LiquidityTable = Record<string, PoolLiquidityResponse>;
export type PoolLiquidityResponse = {
  Token_1_Denominator: string;
  Token_0_Denominator: string;
  Registered: string;
  Token_0: string;
  Token_1: string;
  Updated_At: number;
  Reserves_0: string;
  Reserves_1: string;
};

/**
 * ao connect() instance
 */
export type AoInstance = ReturnType<typeof connect>;

/**
 * Returned message object(s) from dryRun
 */
export interface Message {
  Anchor: string;
  Tags: Tag[];
  Target: string;
  Data: string;
}

export type { Tag };

/**
 * Token pair type
 */
export type Pair = [string, string];

type Pool = [string, string];
export type PoolMap = Record<string, Pool>;
export type PoolOverview = {
  quote_token_process: string;
  quote_token_ticker: string;
  quote_token_name: string;
  base_token_process: string;
  base_token_ticker: string;
  base_token_name: string;
  tvl_rank: number;
  tvl_in_usd: number;
  tvl_in_quote: number;
  tx_count: number;
  apr_30d: number;
  amm_process: string;
  pool_fee_bps: number;
  liquidity_usd: number;
};

export type TokenDetailsR = {
  InternalId: string;
  Deployer: string;
  Name: string;
  Ticker: string;
  Denomination: number;
  Description: string;
  Balances: Record<string, number>;
  TotalSupply: number;
  Telegram: string;
  Twitter: string;
  Website: string;
  Logo: string;
  Status: string;
  LPs: Record<string, string>;
  RenounceOwnership: string | boolean;
  TokenProcess?: string;
};

export type TokenDetails = {
  InternalId: string;
  Deployer: string;
  Name: string;
  Ticker: string;
  Denomination: number;
  Description: string;
  Balances: Record<string, number>;
  TotalSupply: number;
  Telegram: string;
  Twitter: string;
  Website: string;
  Logo: string;
  Status: string;
  LPs: Record<string, string>;
  RenounceOwnership: boolean;
};

export type PoolByTokensResult = {
  poolId: string;
  pending: boolean;
};

export type SuggestedPool = {
  t1_process: string;
  t0_name: string;
  t0_process: string;
  t1_ticker: string;
  t0_ticker: string;
  t1_name: string;
  reserves_0: string;
  amm_process: string;
  reserves_1: string;
};

export type PoolInfo = {
  id: string;
  denomination: number;
  ticker: string;
  logo: string;
  name: string;
  tokenA: string;
  tokenB: string;
  totalSupply: bigint;
  type: string;
  fee: bigint;
};
