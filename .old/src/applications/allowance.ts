import type BigNumber from "bignumber.js";

export interface Allowance {
  enabled: boolean;
  limit: string; // in winstons
  spent: string; // in winstons
}

export interface AllowanceBigNumber {
  enabled: boolean;
  limit: BigNumber; // in winstons
  spent: BigNumber; // in winstons
}

export const defaultAllowance: Allowance = {
  enabled: true,
  limit: "1000000000000",
  spent: "0",
};
