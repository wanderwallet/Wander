import { Quantity } from "ao-tokens";
import BigNumber from "bignumber.js";

/** Token formatting config */
export const tokenConfig: Intl.NumberFormatOptions = {
  maximumFractionDigits: 2,
};

/**
 * Format token balance
 */
export function formatTokenBalance(balance: string | number | BigNumber | Quantity, config?: number) {
  const bigNum = BigNumber.isBigNumber(balance) ? balance : BigNumber(balance.toString());
  return bigNum.toFormat(config ? config : tokenConfig.maximumFractionDigits).replace(/\.?0*$/, "");
}

/** Fiat formatting config */
export const fiatConfig: Intl.NumberFormatOptions = {
  style: "currency",
  currencyDisplay: "symbol",
  maximumFractionDigits: 2,
};

/**
 * Format fiat balance
 */
export function formatFiatBalance(balance: string | number | BigNumber | Quantity, currency?: string) {
  return (+balance).toLocaleString(undefined, {
    ...fiatConfig,
    currency: currency?.toLowerCase(),
  });
}

/**
 * Get prefix for a currency
 */
export function getCurrencySymbol(currency: string) {
  const zeroBal = (0).toLocaleString(undefined, {
    currency,
    ...fiatConfig,
    maximumFractionDigits: 0,
  });

  return zeroBal.replace("0", "");
}

/**
 * Adjust token balance with fractions.
 *
 * Some legacy tokens are need to be manually updated to support this.
 * See the specs at specs.arweave.dev
 */
export function balanceToFractioned(balance: string, denomination: number = 0) {
  if (!balance) return BigNumber("0");

  denomination = denomination || 0;

  // divide base balance using the denomination
  return BigNumber(balance).shiftedBy(-denomination);
}

/**
 * Convert displayed (fractioned) token balance back to
 * the units used by the contract.
 */
export function fractionedToBalance(balance: string, denomination: number = 0) {
  if (!balance) return "0";

  denomination = denomination || 0;
  return BigNumber(balance).shiftedBy(denomination).toFixed(0, BigNumber.ROUND_FLOOR);
}
