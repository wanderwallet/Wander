import type { AoInstance, PoolInfo, PoolMap } from "./data-source.types";
import { DryRunDataSource } from "./dryrun.data-source";
import { SupabaseDataSource } from "./supabase.data-source";
import { log, LOG_GROUP } from "~utils/log/log.utils";

export class DataSourceService {
  private supabase: SupabaseDataSource;
  private dryRun: DryRunDataSource;

  constructor(ao: AoInstance) {
    this.supabase = new SupabaseDataSource(ao);
    this.dryRun = new DryRunDataSource(ao);
  }

  async getPoolsOverview() {
    try {
      log(LOG_GROUP.SWAP, `Fetching pools overview from s`);
      return await this.supabase.getPoolsOverview();
    } catch (error) {
      log(LOG_GROUP.SWAP, `Error fetching pools overview from source, falling back to dryrun`, error);
      return await this.dryRun.getPoolsOverview();
    }
  }

  async getReserves(pool: string, pair: [string, string]): Promise<[bigint, bigint]> {
    return await this.dryRun.getReserves(pool, pair);
  }

  async getPoolByTokens(pair: [string, string], feePercentageBps?: bigint) {
    return await this.dryRun.getPoolByTokens(pair, feePercentageBps);
  }

  async getTokenDetails(tokenProcess: string) {
    return await this.dryRun.getTokenDetails(tokenProcess);
  }

  async getPoolsForToken(tokenId: string) {
    try {
      log(LOG_GROUP.SWAP, `Fetching suggested pools for token ${tokenId} from Supabase`);
      return await this.supabase.getPoolsForToken(tokenId);
    } catch (error) {
      log(LOG_GROUP.SWAP, `Error fetching suggested pools from Supabase, falling back to dryrun`, error);
      return await this.dryRun.getPoolsForToken(tokenId);
    }
  }

  async getGlobalLiquidity() {
    try {
      log(LOG_GROUP.SWAP, `Fetching global liquidity from Supabase`);
      return await this.supabase.getGlobalLiquidity();
    } catch (error) {
      log(LOG_GROUP.SWAP, `Error fetching global liquidity from HB, falling back to dryrun`, error);
      return await this.dryRun.getGlobalLiquidity();
    }
  }

  async getTokensFromAMMFactory() {
    return await this.dryRun.getTokensFromAMMFactory();
  }

  async getPoolInfo(poolId: string): Promise<PoolInfo> {
    return await this.dryRun.getPoolInfo(poolId);
  }

  async getBalance(tokenId: string, user: string): Promise<bigint> {
    return await this.dryRun.getBalance(tokenId, user);
  }

  async getPoolMap(): Promise<PoolMap> {
    return await this.dryRun.getPoolMap();
  }

  async getApprovedTokens(): Promise<string[]> {
    return await this.dryRun.getApprovedTokens();
  }
}

let dataSourceInstance: DataSourceService | null = null;

export function getDataSource(ao: AoInstance): DataSourceService {
  if (!dataSourceInstance) {
    dataSourceInstance = new DataSourceService(ao);
  }
  return dataSourceInstance;
}

export function resetDataSource() {
  dataSourceInstance = null;
}
