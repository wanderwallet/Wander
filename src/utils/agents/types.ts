export type ConfigName = string;

export interface Tag {
  name: string;
  value: string;
}

export interface Services {
  /**
   * The URL of the desired Gateway.
   * @default "https://arweave.net"
   */
  gatewayUrl?: string;

  /**
   * The URL of the desired AO Compute Unit.
   * @default "https://cu.ao-testnet.xyz"
   */
  cuUrl?: string;

  /**
   * The URL of the desired AO Messenger Unit.
   * @default "https://mu.ao-testnet.xyz"
   */
  muUrl?: string;
}

export type DeployConfig = {
  /**
   * Process name to spawn
   * @default "default"
   */
  name?: string;

  /**
   * Path to contract main file
   */
  contractPath: string;

  /**
   * Config name used for logging
   */
  configName?: string;

  /**
   * The module source to use to spin up Process
   * @default "Fetches from `https://raw.githubusercontent.com/pawanpaudel93/ao-deploy-config/main/config.json`"
   */
  module?: string;

  /**
   * Scheduler to use for Process
   * @default "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"
   */
  scheduler?: string;

  /**
   * Additional tags to use for spawning Process
   */
  tags?: Tag[];

  /**
   * Cron interval to use for Process i.e (1-minute, 5-minutes)
   */
  cron?: string;

  /**
   * Retry options
   */
  retry?: {
    /**
     * Retry count
     * @default 10
     */
    count?: number;
    /**
     * Retry delay in milliseconds
     * @default 3000
     */
    delay?: number;
  };

  /**
   * Process Id of an existing process
   */
  processId?: string;

  /**
   * Configuration for various AO services
   */
  services?: Services;

  /**
   * Enable AOS On-Boot loading to load contract when process is spawned.
   * Sets "On-Boot=Data" tag during deployment.
   * CLI: --on-boot
   * @see https://github.com/permaweb/aos?tab=readme-ov-file#boot-loading
   * @default false
   */
  onBoot?: boolean;

  /**
   * Disable logging to console
   * @default false
   */
  silent?: boolean;

  /**
   * Force spawning a new process without checking for existing ones.
   * @default false
   */
  forceSpawn?: boolean;
};

export interface DeployResult {
  name: string;
  configName: string;
  messageId?: string;
  processId: string;
  isNewProcess: boolean;
}

export interface AosConfig {
  module: string;
  sqliteModule: string;
  scheduler: string;
  authority: string;
}

export type AOYieldAgentStatus = "Active" | "Cancelled" | "Completed" | "Paused";

export type AOYieldAgentDex = "BOTEGA" | "PERMASWAP" | "AUTO";

export interface AOYieldAgent {
  id: string;
  status: AOYieldAgentStatus;
  conversionPercentage: number;
  tokenOut: string;
  startDate: number;
  endDate: number;
  runIndefinitely: boolean;
  slippage: number;
  totalTransactions?: number;
  version: string;
}

export interface AOYieldAgentInfo extends AOYieldAgent {
  dex: AOYieldAgentDex;
  totalAOSold: string;
  totalBought: Record<string, number>;
  totalTransactions: number;
  totalWanderFee: string;
  swapInProgress: boolean;
  processedUpToDate?: number;
  swappedUpToDate?: number;
}

export interface AOYieldAgentCreate {
  conversionPercentage: number;
  asset: Asset;
  slippage: number;
  runIndefinitely: boolean;
  startDate: number;
  endDate: number;
}

export interface Asset {
  denomination: number;
  ticker: string;
  logo: string;
  id: string;
}

export interface SwapSuccessTransaction {
  amountIn: string;
  amountOut: string;
  tokenIn: string;
  tokenOut: string;
  wanderFee: string;
  timestamp: number;
  id: string;
  cursor: string;
}

export type MintingStatus = "Active" | "Paused";

export type RecentTx = {
  id: string;
  timestamp: number;
  queryCount: number;
};

export interface MintTransaction {
  id: string;
  timestamp: number;
  total?: number;
  nonce?: number;
}

export interface ParsedMintData {
  recipient: string;
  amount: string;
  user: string;
  token: string;
}

export interface MintQuantityResult {
  quantity: string;
  swapDateFrom: number;
  swapDateTo: number;
}

export interface AOYieldAgentSyncStatus {
  status: "in_progress" | "completed";
  timestamp: number;
}
