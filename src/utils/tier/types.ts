export type Tier = "Elite" | "Platinum" | "Prime" | "Plus" | "Unranked";

export type TierProgress = {
  balanceNeeded: string;
  currentBalance: string;
  currentRank: number;
  nextTier: Tier;
  nextTierRequirement: string;
};

export type ActiveTier = {
  tier: Tier;
  progress: TierProgress;
};
