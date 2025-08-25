export const TIER_PROCESS_ID = "rkAezEIgacJZ_dVuZHOKJR8WKpSDqLGfgPJrs_Es7CA";

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

export const tierIdToTierName = {
  1: TierTypes.Prime,
  2: TierTypes.Edge,
  3: TierTypes.Reserve,
  4: TierTypes.Select,
  5: TierTypes.Core,
};

export const tierNameToId = {
  [TierTypes.Prime]: 1,
  [TierTypes.Edge]: 2,
  [TierTypes.Reserve]: 3,
  [TierTypes.Select]: 4,
  [TierTypes.Core]: 5,
};

export const defiFeePercent = 1;

export const EXPLORE_TIER_BENEFITS = "explore_tier_benefits";
export const ACTIVITY_NOTIFICATIONS_NOTICE = "activity_notifications_notice";
