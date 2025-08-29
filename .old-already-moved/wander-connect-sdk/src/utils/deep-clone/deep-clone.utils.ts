export const deepClone =
  typeof structuredClone === "function"
    ? structuredClone
    : function <T = any>(value: T) {
        return JSON.parse(JSON.stringify(value)) as T;
      };
