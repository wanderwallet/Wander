import { log, LOG_GROUP } from "~utils/log/log.utils";
import type { BotegaPool, BotegaPoolOverview } from "../swap.types";
import type { Tag } from "arweave/web/lib/transaction";
import { getTagValue, flattenTags, type AoInstance, type Message } from "~tokens/aoTokens/ao";
import type {
  PoolByTokensResult,
  PoolInfo,
  PoolLiquidity,
  PoolMap,
  SuggestedPool,
  TokenDetails,
  TokenDetailsR,
} from "./data-source.types";
import { DEXI, AMM_FACTORY, TOKENDROP_REGISTRY, GL_PROCESS } from "./data-source.constants";

export class DryRunDataSource {
  constructor(private ao: AoInstance) {}

  async getPoolsOverview(): Promise<BotegaPoolOverview[]> {
    log(LOG_GROUP.SWAP, "Fetching pools overview via dryrun");
    const res = await this.ao.dryrun({
      process: DEXI,
      tags: [
        { name: "Action", value: "Get-Pool-Overview" },
        { name: "Start-Rank", value: "1" },
        { name: "End-Rank", value: "1000" },
      ],
    });

    for (const msg of res.Messages as Message[]) {
      if (msg.Data.length === 0) continue;
      return JSON.parse(msg.Data);
    }

    return [];
  }

  async getReserves(pool: string, pair: [string, string]): Promise<[bigint, bigint]> {
    log(LOG_GROUP.SWAP, `Fetching reserves for pool ${pool} via dryrun`);
    const res = await this.ao.dryrun({
      process: pool,
      tags: [{ name: "Action", value: "Get-Reserves" }],
    });

    if (res.Messages.length > 0) {
      const tags = res.Messages[0].Tags || [];

      console.log(`Tags for pool ${pool}:`, tags);

      const token0Reserves = getTagValue(pair[0], tags);
      const token1Reserves = getTagValue(pair[1], tags);

      if (token0Reserves && token1Reserves) {
        const reserves0 = BigInt(token0Reserves);
        const reserves1 = BigInt(token1Reserves);

        if (reserves0 > 0n && reserves1 > 0n) {
          console.log(`Reserves for pool ${pool}: ${reserves0}, ${reserves1}`);
          log(LOG_GROUP.SWAP, `Found reserves for pool ${pool}: ${reserves0}, ${reserves1}`);
          return [reserves0, reserves1];
        }
      }
    }

    log(LOG_GROUP.SWAP, `No valid reserves found for pool ${pool}`);
    return [0n, 0n];
  }

  async getPoolByTokens(pair: [string, string], feePercentageBps?: bigint): Promise<PoolByTokensResult> {
    log(LOG_GROUP.SWAP, `Fetching pool by tokens ${pair} via dryrun`);
    const tags = [
      { name: "Action", value: "Get-Pool" },
      { name: "Token-A", value: pair[0] },
      { name: "Token-B", value: pair[1] },
    ];

    if (feePercentageBps) {
      tags.push({ name: "Fee-Bps", value: feePercentageBps.toString() });
    }

    const result = await this.ao.dryrun({
      process: AMM_FACTORY,
      tags,
    });

    const poolIdTag = getTagValue("Pool-Id", result.Messages[0]?.Tags || []);
    const pendingTag = getTagValue("Pending", result.Messages[0]?.Tags || []);

    if (!poolIdTag || poolIdTag === "pending") {
      throw new Error("Pool not found");
    }

    return {
      poolId: poolIdTag,
      pending: pendingTag === "true",
    };
  }

  async getTokenDetails(tokenProcess: string): Promise<TokenDetails> {
    log(LOG_GROUP.SWAP, `Fetching token details for ${tokenProcess} via dryrun`);
    const result = await this.ao.dryrun({
      process: TOKENDROP_REGISTRY,
      tags: [
        { name: "Action", value: "Token-By-Process" },
        { name: "TokenProcess", value: tokenProcess },
      ],
    });

    if (result.Messages.length === 0) throw new Error("No response from Token-By-Process");

    const data = result.Messages[0].Data;
    if (!data) throw new Error("Response malformed");

    const tokenDetailsR: TokenDetailsR = JSON.parse(data);

    return {
      ...tokenDetailsR,
      RenounceOwnership:
        typeof tokenDetailsR.RenounceOwnership === "string"
          ? tokenDetailsR.RenounceOwnership === "true"
          : tokenDetailsR.RenounceOwnership,
    };
  }

  async getSuggestedPools(tokenId: string): Promise<SuggestedPool[]> {
    const res = await this.ao.dryrun({
      process: DEXI,
      tags: [
        { name: "Action", value: "Find-Best-Pairs-For-Token" },
        { name: "Token", value: tokenId },
      ],
    });
    const suggestions = JSON.parse(res.Messages[0].Data);
    console.log("onSuggestedPools", suggestions);
    return suggestions as SuggestedPool[];
  }

  async getPoolsForToken(tokenProcess: string): Promise<BotegaPool[]> {
    log(LOG_GROUP.SWAP, `Fetching pools for token ${tokenProcess} via dryrun`);
    const res = await this.ao.dryrun({
      process: DEXI,
      tags: [
        { name: "Action", value: "Find-Best-Pairs-For-Token" },
        { name: "Token", value: tokenProcess },
      ],
    });

    if (res.Messages.length === 0) {
      throw new Error("No response from Get-Pools-By-Token");
    }

    const suggestions = JSON.parse(res.Messages[0].Data) as SuggestedPool[];

    return suggestions.map((pool) => {
      return {
        amm_name: pool.amm_process,
        amm_process: pool.amm_process,
        amm_status: "public",
        pool_fee_bps: 0, // Assuming fee is not provided in the response
        token0_denominator: 1, // Assuming denominator is 1 for simplicity
        token0_name: pool.t0_name,
        token0_process: pool.t0_process,
        token0_ticker: pool.t0_ticker,
        token1_denominator: 1, // Assuming denominator is 1 for simplicity
        token1_name: pool.t1_name,
        token1_process: pool.t1_process,
        token1_ticker: pool.t1_ticker,
        amm_discovered_at_ts: Date.now(), // Using current timestamp for discovery time
      };
    });
  }

  async getGlobalLiquidity(): Promise<PoolLiquidity[]> {
    let tags = [{ name: "Action", value: "Get-Liquidity-Table" }];

    const result = await this.ao.dryrun({
      process: GL_PROCESS,
      tags,
    });

    if (result.Messages.length === 0) throw new Error("No response from Get-Liquidity-Table (pools)");
    const { Data: data } = result.Messages[0];

    const poolsRaw = JSON.parse(data) as {
      token_1_decimals: number;
      amm_name: string;
      amm_quote_token: string;
      amm_token1: string;
      amm_process: string;
      reserves_0: string;
      created_at_ts: number;
      reserves_1: string;
      amm_status: string;
      amm_discovered_at_ts: number;
      pool_fee_bps: number;
      token_0_decimals: number;
      amm_base_token: string;
      amm_token0: string;
    }[];

    const pools: PoolLiquidity[] = Object.entries(poolsRaw).map(([key, pool]) => {
      return {
        amm_base_token: pool.amm_base_token,
        amm_token0: pool.amm_token0,
        amm_quote_token: pool.amm_quote_token,
        amm_name: pool.amm_name,
        amm_process: pool.amm_process,
        reserves_0: pool.reserves_0,
        reserves_1: pool.reserves_1,
        pool_fee_bps: pool.pool_fee_bps,
        amm_status: "public",
        amm_discovered_at_ts: pool.amm_discovered_at_ts,
        amm_token1: pool.amm_token1,
        token_0_decimals: pool.token_0_decimals,
        token_1_decimals: pool.token_1_decimals,
      };
    });
    return pools;
  }

  async getTokensFromAMMFactory(): Promise<string[]> {
    log(LOG_GROUP.SWAP, `Fetching tokens from AMM factory via dryrun`);
    const res = await this.ao.dryrun({
      process: AMM_FACTORY,
      tags: [{ name: "Action", value: "Get-Tokens" }],
    });

    if (res.Messages.length === 0) {
      throw new Error("No response from Get-Tokens (AMM Factory)");
    }

    const data = JSON.parse(res.Messages[0].Data) as string[];
    return data || [];
  }

  async getPoolInfo(poolId: string): Promise<PoolInfo> {
    let tries = 0;
    let lastError: unknown;

    while (tries < 10) {
      try {
        // read order result
        const result = await this.ao.dryrun({
          process: poolId,
          tags: [{ name: "Action", value: "Info" }],
        });

        if (result.Messages.length > 0) {
          const tags = flattenTags(result.Messages[0].Tags);

          // const extraMetadata = JSON.parse(tags["Data"])

          return {
            id: poolId,
            denomination: parseInt(tags["Denomination"]),
            ticker: tags["Ticker"],
            logo: tags["Logo"],
            name: tags["Name"],
            tokenA: tags["TokenA"],
            tokenB: tags["TokenB"],
            totalSupply: BigInt(tags["TotalSupply"]),
            type: tags["Type"],
            fee: BigInt(Math.floor(Number(tags["FeeBps"])) || 25n),
            // subscriptions: extraMetadata.Subscriptions,
          };
        }
        throw new Error(`No response from the pool get Info, pool: ${poolId}`);
      } catch (error) {
        console.error(error);
        lastError = error instanceof Error ? error.message : error;
        tries++;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    if (typeof lastError === "string") {
      throw new Error(lastError);
    }

    throw lastError;
  }

  async getPoolMap(): Promise<PoolMap> {
    const res = await this.ao.dryrun({
      process: AMM_FACTORY,
      tags: [{ name: "Action", value: "Get-Pools" }],
    });

    for (const msg of res.Messages as Message[]) {
      if (getTagValue("Action", msg.Tags) !== "Get-Pools-Response") continue;
      return JSON.parse(msg.Data);
    }

    return {};
  }

  async getBalance(tokenId: string, user: string): Promise<bigint> {
    log(LOG_GROUP.SWAP, `Fetching balance for token ${tokenId} and user ${user} via dryrun`);
    const res = await this.ao.dryrun({
      process: tokenId,
      tags: [
        {
          name: "Action",
          value: "Balance",
        },
        {
          name: "Target",
          value: user,
        },
      ],
    });

    if (res.Messages.length === 0) {
      throw new Error("No response from Get-Balance");
    }

    const balanceTag = res.Messages[0].Tags.find((tag: Tag) => tag.name === "Balance");
    if (!balanceTag) {
      throw new Error("Balance not found in response");
    }

    return BigInt(balanceTag.value);
  }

  async getApprovedTokens(): Promise<string[]> {
    log(LOG_GROUP.SWAP, `Fetching approved tokens via dryrun`);
    const res = await this.ao.dryrun({
      process: DEXI,
      tags: [{ name: "Action", value: "Get-Community-Approved-Tokens" }],
    });

    if (res.Messages.length === 0) {
      throw new Error("No response from Get-Community-Approved-Tokens");
    }

    const approvedTokens = res.Messages[0].Tags.find((x: any) => x.name === "Community-Approved-Tokens")
      ?.value as string[];

    return approvedTokens || [];
  }
}
