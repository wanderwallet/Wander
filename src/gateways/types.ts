export interface PaginatedResult<T> {
  hasMore: boolean;
  items: T[];
  limit: number;
  nextCursor: string;
  sortBy: string;
  sorOrder: string;
  totalItems: number;
}

export interface GatewaySettings {
  port: number;
  protocol: string;
  minDelegatedStake: number;
  fqdn: string;
  delegateRewardShareRatio: number;
  autoStake: boolean;
  note: string;
  allowDelegatedStaking: boolean;
  label: string;
  properties:
    | string
    | {
        GRAPHQL: boolean;
        ARNS: boolean;
        MAX_PAGE_SIZE: number;
      };
}

export interface GatewayStats {
  failedConsecutiveEpochs: number;
  observedEpochCount: number;
  passedConsecutiveEpochs: number;
  totalEpochCount: number;
  prescribedEpochCount: number;
  passedEpochCount: number;
  failedEpochCount: number;
}

export interface GatewayWeights {
  compositeWeight: number;
  observerRewardRatioWeight: number;
  normalizedCompositeWeight: number;
  tenureWeight: number;
  gatewayRewardRatioWeight: number;
  stakeWeight: number;
}

export interface GatewayAddressRegistryItemData {
  gatewayAddress: string;
  observerAddress: string;
  operatorStake: number;
  startTimestamp: number;
  status: "joined" | "leaving";
  totalDelegatedStake: number;
  settings: GatewaySettings;
  stats: GatewayStats;
  weights: GatewayWeights;
}

export interface GatewayUnknownCheck {
  status: "unknown";
}

export interface GatewayPendingCheck {
  status: "pending";
}

export interface GatewaySuccessCheck {
  status: "success";
  value: number;
}

export interface GatewayErrorCheck {
  status: "error";
  error: "string";
}

export type GatewayCheck = GatewayUnknownCheck | GatewayPendingCheck | GatewaySuccessCheck | GatewayErrorCheck;

export interface GatewayAddressRegistryItem extends GatewayAddressRegistryItemData {
  id: string;
  linkFull: string;
  linkDisplay: string;
  ping: GatewayCheck;
  health: GatewayCheck;
}
