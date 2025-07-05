export const TIER_PROCESS_ID = "Unzzq_gNIBn-D-IrUPvXV4BKRqox3naPTees4I5-Gqo";

export enum TierTypes {
  Core = "Core",
  Select = "Select",
  Reserve = "Reserve",
  Edge = "Edge",
  Prime = "Prime",
}

export const defiFeeReductionsInPercent = {
  [TierTypes.Core]: 0,
  [TierTypes.Select]: 5,
  [TierTypes.Reserve]: 25,
  [TierTypes.Edge]: 75,
  [TierTypes.Prime]: 100,
};

export const defiFeePercent = 1;

export const EXPLORE_TIER_BENEFITS = "explore_tier_benefits";
