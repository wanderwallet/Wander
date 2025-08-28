export enum PoolTypeEnum {
  BOTEGA = "botega",
  PERMASWAP = "permaswap",
  AOX = "aox",
  VENTO = "vento",
}

// Launch timestamp (2025-09-01 00:00:00 EDT)
const SWAP_LAUNCH_TIMESTAMP = Date.parse("2025-09-01T00:00:00-04:00");

// 14 days in ms (86_400_000 ms = 1 day)
const TWO_WEEKS_MS = 1_209_600_000;

// Swap disabled for lower tiers until 14 days after launch
export const SWAP_DISABLED_FOR_LOWER_TIERS = Date.now() < SWAP_LAUNCH_TIMESTAMP + TWO_WEEKS_MS;
