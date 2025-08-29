import type { BotegaPool, BotegaPoolOverview } from "../swap.types";
import { BOTEGA_API_KEY, BOTEGA_SUPABASE_URL } from "./data-source.constants";
import type { AoInstance, PoolLiquidity } from "./data-source.types";
import { log, LOG_GROUP } from "~utils/log/log.utils";

interface SupabaseConfig {
  /** e.g. https://project-ref.supabase.co (NO trailing slash) */
  url: string;
  /** anon or service_role key so Edge Function will run */
  apiKey: string;
}

/**
 * Lightweight data-source that calls Supabase Edge Functions
 * through plain `fetch` instead of the Supabase JS client.
 */
export class SupabaseDataSource {
  private readonly cfg: SupabaseConfig;

  constructor(_ao: AoInstance) {
    this.cfg = {
      url: BOTEGA_SUPABASE_URL,
      apiKey: BOTEGA_API_KEY,
    };

    if (!this.cfg.url || !this.cfg.apiKey) {
      throw new Error("SupabaseDataSource needs SUPABASE_URL and SUPABASE_ANON_KEY");
    }
  }

  /* ---------- DataSource methods ---------- */

  async getPoolsOverview(): Promise<BotegaPoolOverview[]> {
    log(LOG_GROUP.SWAP, "Fetching pools overview via fetch /overview");

    const response = await fetch(`${this.cfg.url}/functions/v1/overview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data) {
      throw new Error("No response from Get-Overview (pools)");
    }

    if (!Array.isArray(data)) return [];

    return data.map((pool) => ({
      quote_token_process: pool.token0_process,
      quote_token_ticker: pool.token0_ticker,
      quote_token_name: pool.token0_name,
      base_token_process: pool.token1_process,
      base_token_ticker: pool.token1_ticker,
      base_token_name: pool.token1_name,
      tvl_rank: pool.tvl_rank ?? 0,
      tvl_in_usd: pool.liquidity_usd,
      tvl_in_quote: pool.tvl_in_quote ?? 0,
      tx_count: pool.transactions,
      apr_30d: pool.apr_30d ?? 0,
      amm_process: pool.amm_process,
      pool_fee_bps: pool.pool_fee_bps,
      liquidity_usd: pool.liquidity_usd,
    }));
  }

  async getPoolsForToken(tokenProcess: string): Promise<BotegaPool[]> {
    const response = await fetch(`${this.cfg.url}/functions/v1/pools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const poolsRaw = (await response.json()) as BotegaPool[];
    if (!poolsRaw?.length) return [];

    const pools = poolsRaw.filter((p) => p.token0_process === tokenProcess || p.token1_process === tokenProcess);

    if (!pools.length) {
      log(LOG_GROUP.SWAP, `No pools found for token ${tokenProcess}`);
      return [];
    }

    return pools;
  }

  async getGlobalLiquidity(): Promise<PoolLiquidity[]> {
    log(LOG_GROUP.SWAP, "Fetching all pools via fetch /pools");

    const response = await fetch(`${this.cfg.url}/functions/v1/pools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.cfg.apiKey}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const poolsRaw = (await response.json()) as BotegaPool[];
    if (!poolsRaw?.length) return [];

    // Convert BotegaPool to PoolLiquidity format
    return poolsRaw.map((pool) => ({
      amm_name: pool.amm_name,
      amm_process: pool.amm_process,
      amm_token0: pool.token0_process,
      amm_token1: pool.token1_process,
      amm_status: pool.amm_status,
      pool_fee_bps: pool.pool_fee_bps,
      token_0_decimals: pool.token0_denominator,
      token_1_decimals: pool.token1_denominator,
      reserves_0: "0", // These would need to be fetched separately
      reserves_1: "0", // These would need to be fetched separately
      created_at_ts: pool.amm_discovered_at_ts,
      amm_discovered_at_ts: pool.amm_discovered_at_ts,
      amm_base_token: pool.token0_process,
      amm_quote_token: pool.token1_process,
    }));
  }
}
