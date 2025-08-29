export type StorageItem<T = string> =
  | T
  | {
      /**
       * The value to store.
       */
      value: T;
      /**
       * The expiration unix timestamp of the item.
       * Optional, but either this or priority should be present.
       */
      expiresAt?: number;
      /**
       * Higher number = higher priority (less likely to be evicted).
       * Optional, but either this or expiresAt should be present.
       */
      priority?: number;
    };

export interface ItemStorageOptions {
  expiresIn?: number;
  priority?: number;
}

/**
 * Helper method to determine if a parsed item is a complex StorageItem with metadata
 */
export function isComplexStorageItem<T>(
  item: any,
  requiredMetadata: {
    expiresAt?: boolean;
    priority?: boolean;
  } = {},
): item is { value: T; expiresAt?: number; priority?: number } {
  // Early bailout checks for non-objects
  if (!item || typeof item !== "object" || item === null) {
    return false;
  }

  // Check for required value property
  if (!("value" in item)) {
    return false;
  }

  // Check for at least one metadata property
  const hasExpiresAt = "expiresAt" in item;
  const hasPriority = "priority" in item;

  if (!hasExpiresAt && !hasPriority) {
    return false;
  }

  // Check specific required options if provided
  if (requiredMetadata.expiresAt && !hasExpiresAt) {
    return false;
  }

  if (requiredMetadata.priority && !hasPriority) {
    return false;
  }

  return true;
}
