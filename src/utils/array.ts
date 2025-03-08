export function asArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}
