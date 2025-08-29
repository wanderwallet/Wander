import type { Storage } from "@plasmohq/storage";
import { ExtensionStorage } from "~utils/storage";

/**
 * Configuration options for ExtensionStorageArray
 */
export interface StorageArrayConfig<T> {
  /** Prevent duplicate values from being added */
  preventDuplicates?: boolean;
  /** Property key to use for duplicate checking on objects */
  uniqueKey?: keyof T;
  /** Custom function to determine uniqueness */
  uniqueBy?: (item: T) => any;
}

/**
 * ExtensionStorageArray - A class that provides array-like operations for a specific storage key
 *
 * This class wraps around the extension storage to provide convenient array manipulation methods
 * while maintaining persistence in the extension storage.
 *
 * @template T - The type of items stored in the array
 */
export class ExtensionStorageArray<T = any> {
  private storage: Storage;
  private storageKey: string;
  private config: StorageArrayConfig<T>;

  constructor(storage: Storage, storageKey: string, config: StorageArrayConfig<T> = {}) {
    this.storage = storage;
    this.storageKey = storageKey;
    this.config = config;
  }

  /**
   * Get the entire array from storage
   * @returns Promise resolving to the array or empty array if not found
   */
  private async getArray(): Promise<T[]> {
    const items = await this.storage.get(this.storageKey);
    return Array.isArray(items) ? items : [];
  }

  /**
   * Get the unique identifier for an item based on configuration
   * @param item - The item to get identifier for
   * @returns The unique identifier
   */
  private getUniqueIdentifier(item: T): any {
    if (this.config.uniqueBy) {
      return this.config.uniqueBy(item);
    }
    if (this.config.uniqueKey) {
      return item[this.config.uniqueKey];
    }
    return item;
  }

  /**
   * Check if an item already exists in the array
   * @param items - The array to check
   * @param newItem - The item to check for duplicates
   * @returns True if duplicate exists, false otherwise
   */
  private isDuplicate(items: T[], newItem: T): boolean {
    if (!this.config.preventDuplicates) {
      return false;
    }

    const newItemId = this.getUniqueIdentifier(newItem);
    return items.some((existingItem) => {
      const existingItemId = this.getUniqueIdentifier(existingItem);
      return existingItemId === newItemId;
    });
  }

  /**
   * Filter out duplicate items from a list of new items
   * @param currentItems - The current array items
   * @param newItems - The new items to filter
   * @returns Array of non-duplicate items
   */
  private filterDuplicates(currentItems: T[], newItems: T[]): T[] {
    if (!this.config.preventDuplicates) {
      return newItems;
    }

    return newItems.filter((newItem) => !this.isDuplicate(currentItems, newItem));
  }

  /**
   * Get the length of the array
   * @returns Promise resolving to the array length
   */
  async length(): Promise<number> {
    const items = await this.getArray();
    return items.length;
  }

  /**
   * Get all items from the array
   * @returns Promise resolving to all items in the array
   */
  async getAll(): Promise<T[]> {
    return await this.getArray();
  }

  /**
   * Add one or more items to the end of the array
   * @param items - The items to add
   * @returns Promise resolving to the new length of the array
   */
  async push(...items: T[]): Promise<number> {
    const currentItems = await this.getArray();
    const itemsToAdd = this.filterDuplicates(currentItems, items);
    currentItems.push(...itemsToAdd);
    await this.storage.set(this.storageKey, currentItems);
    return currentItems.length;
  }

  /**
   * Remove and return the last item from the array
   * @returns Promise resolving to the removed item or undefined if array is empty
   */
  async pop(): Promise<T | undefined> {
    const items = await this.getArray();
    const poppedItem = items.pop();
    await this.storage.set(this.storageKey, items);
    return poppedItem;
  }

  /**
   * Remove and return the first item from the array
   * @returns Promise resolving to the removed item or undefined if array is empty
   */
  async shift(): Promise<T | undefined> {
    const items = await this.getArray();
    const shiftedItem = items.shift();
    await this.storage.set(this.storageKey, items);
    return shiftedItem;
  }

  /**
   * Add one or more items to the beginning of the array
   * @param items - The items to add
   * @returns Promise resolving to the new length of the array
   */
  async unshift(...items: T[]): Promise<number> {
    const currentItems = await this.getArray();
    const itemsToAdd = this.filterDuplicates(currentItems, items);
    currentItems.unshift(...itemsToAdd);
    await this.storage.set(this.storageKey, currentItems);
    return currentItems.length;
  }

  /**
   * Remove items from the array and optionally insert new items in their place
   * @param start - The index to start at
   * @param deleteCount - The number of items to remove
   * @param items - The items to insert
   * @returns Promise resolving to an array of the removed items
   */
  async splice(start: number, deleteCount?: number, ...items: T[]): Promise<T[]> {
    const currentItems = await this.getArray();
    // For splice, we need to filter duplicates considering the array state after removal
    const tempArray = [...currentItems];
    tempArray.splice(start, deleteCount ?? tempArray.length - start);
    const itemsToAdd = this.filterDuplicates(tempArray, items);

    const removedItems = currentItems.splice(start, deleteCount ?? currentItems.length - start, ...itemsToAdd);
    await this.storage.set(this.storageKey, currentItems);
    return removedItems;
  }

  /**
   * Find the index of an item in the array
   * @param searchElement - The item to search for
   * @param fromIndex - The index to start searching from
   * @returns Promise resolving to the index of the item or -1 if not found
   */
  async indexOf(searchElement: T, fromIndex?: number): Promise<number> {
    const items = await this.getArray();
    return items.indexOf(searchElement, fromIndex);
  }

  /**
   * Find the last index of an item in the array
   * @param searchElement - The item to search for
   * @param fromIndex - The index to start searching from (backwards)
   * @returns Promise resolving to the last index of the item or -1 if not found
   */
  async lastIndexOf(searchElement: T, fromIndex?: number): Promise<number> {
    const items = await this.getArray();
    return items.lastIndexOf(searchElement, fromIndex);
  }

  /**
   * Check if the array includes a specific item
   * @param searchElement - The item to search for
   * @param fromIndex - The index to start searching from
   * @returns Promise resolving to true if the item is found, false otherwise
   */
  async includes(searchElement: T, fromIndex?: number): Promise<boolean> {
    const items = await this.getArray();
    return items.includes(searchElement, fromIndex);
  }

  /**
   * Find an item in the array using a predicate function
   * @param predicate - Function to test each item
   * @returns Promise resolving to the found item or undefined
   */
  async find(predicate: (value: T, index: number, obj: T[]) => boolean): Promise<T | undefined> {
    const items = await this.getArray();
    return items.find(predicate);
  }

  /**
   * Find the index of an item in the array using a predicate function
   * @param predicate - Function to test each item
   * @returns Promise resolving to the index of the found item or -1
   */
  async findIndex(predicate: (value: T, index: number, obj: T[]) => boolean): Promise<number> {
    const items = await this.getArray();
    return items.findIndex(predicate);
  }

  /**
   * Filter the array and return a new array with items that pass the test
   * @param predicate - Function to test each item
   * @returns Promise resolving to a new array with filtered items
   */
  async filter(predicate: (value: T, index: number, array: T[]) => boolean): Promise<T[]> {
    const items = await this.getArray();
    return items.filter(predicate);
  }

  /**
   * Transform each item in the array and return a new array
   * @param callback - Function to transform each item
   * @returns Promise resolving to a new array with transformed items
   */
  async map<U>(callback: (value: T, index: number, array: T[]) => U): Promise<U[]> {
    const items = await this.getArray();
    return items.map(callback);
  }

  /**
   * Sort the array in place
   * @param compareFn - Optional compare function for sorting
   * @returns Promise resolving when the operation is complete
   */
  async sort(compareFn?: (a: T, b: T) => number): Promise<void> {
    const items = await this.getArray();
    items.sort(compareFn);
    await this.storage.set(this.storageKey, items);
  }

  /**
   * Reverse the array in place
   * @returns Promise resolving when the operation is complete
   */
  async reverse(): Promise<void> {
    const items = await this.getArray();
    items.reverse();
    await this.storage.set(this.storageKey, items);
  }

  /**
   * Get a slice of the array without modifying the original
   * @param start - The start index
   * @param end - The end index
   * @returns Promise resolving to a new array containing the slice
   */
  async slice(start?: number, end?: number): Promise<T[]> {
    const items = await this.getArray();
    return items.slice(start, end);
  }

  /**
   * Execute a function for each item in the array
   * @param callback - Function to execute for each item
   * @returns Promise resolving when all items have been processed
   */
  async forEach(callback: (value: T, index: number, array: T[]) => void): Promise<void> {
    const items = await this.getArray();
    items.forEach(callback);
  }

  /**
   * Test whether all items in the array pass a test
   * @param predicate - Function to test each item
   * @returns Promise resolving to true if all items pass, false otherwise
   */
  async every(predicate: (value: T, index: number, array: T[]) => boolean): Promise<boolean> {
    const items = await this.getArray();
    return items.every(predicate);
  }

  /**
   * Test whether at least one item in the array passes a test
   * @param predicate - Function to test each item
   * @returns Promise resolving to true if at least one item passes, false otherwise
   */
  async some(predicate: (value: T, index: number, array: T[]) => boolean): Promise<boolean> {
    const items = await this.getArray();
    return items.some(predicate);
  }

  /**
   * Apply a function against an accumulator and each item in the array
   * @param callback - Function to execute on each item
   * @param initialValue - Initial value for the accumulator
   * @returns Promise resolving to the final accumulator value
   */
  async reduce<U>(
    callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue: U,
  ): Promise<U> {
    const items = await this.getArray();
    return items.reduce(callback, initialValue);
  }

  /**
   * Apply a function against an accumulator and each item in the array (from right to left)
   * @param callback - Function to execute on each item
   * @param initialValue - Initial value for the accumulator
   * @returns Promise resolving to the final accumulator value
   */
  async reduceRight<U>(
    callback: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U,
    initialValue: U,
  ): Promise<U> {
    const items = await this.getArray();
    return items.reduceRight(callback, initialValue);
  }

  /**
   * Remove all items that match a predicate function
   * @param predicate - Function to test each item for removal
   * @returns Promise resolving to the number of items removed
   */
  async removeWhere(predicate: (value: T, index: number, array: T[]) => boolean): Promise<number> {
    const items = await this.getArray();
    const initialLength = items.length;
    const filteredItems = items.filter((item, index, array) => !predicate(item, index, array));
    await this.storage.set(this.storageKey, filteredItems);
    return initialLength - filteredItems.length;
  }

  /**
   * Update all items that match a predicate function
   * @param predicate - Function to test each item for update
   * @param updater - Function to update the matching items
   * @returns Promise resolving to the number of items updated
   */
  async updateWhere(
    predicate: (value: T, index: number, array: T[]) => boolean,
    updater: (value: T, index: number, array: T[]) => T,
  ): Promise<number> {
    const items = await this.getArray();
    let updateCount = 0;

    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i], i, items)) {
        items[i] = updater(items[i], i, items);
        updateCount++;
      }
    }

    if (updateCount > 0) {
      await this.storage.set(this.storageKey, items);
    }

    return updateCount;
  }

  /**
   * Clear the entire array
   * @returns Promise resolving when the operation is complete
   */
  async clear(): Promise<void> {
    await this.storage.set(this.storageKey, []);
  }

  /**
   * Check if the array is empty
   * @returns Promise resolving to true if empty, false otherwise
   */
  async isEmpty(): Promise<boolean> {
    const items = await this.getArray();
    return items.length === 0;
  }

  /**
   * Get an item at a specific index
   * @param index - The index to retrieve
   * @returns Promise resolving to the item or undefined if index is out of bounds
   */
  async get(index: number): Promise<T | undefined> {
    const items = await this.getArray();
    return items[index];
  }

  /**
   * Set an item at a specific index
   * @param index - The index to set
   * @param item - The item to set
   * @returns Promise resolving when the operation is complete
   */
  async set(index: number, item: T): Promise<void> {
    const items = await this.getArray();
    items[index] = item;
    await this.storage.set(this.storageKey, items);
  }
}

/**
 * Create a new ExtensionStorageArray instance for a specific key
 * @param storageKey - The key to use for storage
 * @param config - Configuration options for the storage array
 * @returns A new ExtensionStorageArray instance
 */
export function createStorageArray<T = any>(
  storageKey: string,
  config?: StorageArrayConfig<T>,
): ExtensionStorageArray<T> {
  return new ExtensionStorageArray<T>(ExtensionStorage, storageKey, config);
}
