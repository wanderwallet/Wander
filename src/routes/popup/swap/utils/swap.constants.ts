export enum PoolTypeEnum {
  BOTEGA = "botega",
  PERMASWAP = "permaswap",
  AOX = "aox",
  VENTO = "vento",
}

// Swap disabled for lower tiers until Sept 15th 2025
export const SWAP_DISABLED_FOR_LOWER_TIERS = Date.now() < Date.parse("2025-09-15T00:00:00-04:00");

export const RESERVE_TIER_ID = 3;

export const WANDER_FEE_RECIPIENT = "CDoilQgKg6Pmp4Q0LJ4d84VXRgB3Ay9pIJ_SA617cVk";
