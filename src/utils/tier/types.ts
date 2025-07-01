export type Tier = "Elite" | "Prime" | "Plus" | "Select" | "Core" | "Unranked";

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
  progress: TierProgress;
};
