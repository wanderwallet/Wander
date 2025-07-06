export type Tier = "Prime" | "Edge" | "Reserve" | "Select" | "Core";

export type TierProgress = {
  balanceNeeded: string;
  currentBalance: string;
  currentRank: number;
  nextTier: Tier;
  nextTierRequirement: string;
  progressPercent: number;
};

export type ActiveTier = {
  tier: Tier;
  balance: string;
  rank: number;
  progress: number;
  snapshotTimestamp: number;
};

export type DefiFeeDetails = {
  originalFeePercent: string;
  finalFeePercent: string;
  feeHasChanged: boolean;
};

export type WalletSavings = {
  lifetimeSavings: string;
  lastUpdated: number;
  fresh: boolean;
};
