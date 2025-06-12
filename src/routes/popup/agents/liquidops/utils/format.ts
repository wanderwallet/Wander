import { Quantity } from "ao-tokens";
import BigNumber, { ROUND_DOWN } from "bignumber.js";

BigNumber.config({
  FORMAT: {
    decimalSeparator: ".",
    groupSeparator: ",",
    groupSize: 3,
  },
});

/**
 * Formats a number/bignumber similarly to "toLocalString()"
 * @param val Number to format
 * @param maxDigits Optional maximum digits
 * @param smallDisplayedDigits When the number is too small, the max digits is overwritten by this value (set it to 0 to disable)
 * @returns The formatted number
 */
export function formatNumber(val: BigNumber | number | Quantity, maxDigits = 2, smallDisplayedDigits = 6) {
  const oneQty = new Quantity(1n, 0n);
  const oneBig = BigNumber(1);

  if (typeof val === "string") {
    val = BigNumber(val);
  }

  if (
    (typeof val === "number" && val < 1) ||
    (val instanceof Quantity && Quantity.lt(val, oneQty)) ||
    (BigNumber.isBigNumber(val) && val.isLessThan(oneBig))
  ) {
    maxDigits = Math.max(smallDisplayedDigits, maxDigits);
  }

  if (typeof val === "number" || val instanceof Quantity) {
    // @ts-expect-error
    return val.toLocaleString(undefined, { maximumFractionDigits: maxDigits });
  }

  return val
    .toFormat(maxDigits, ROUND_DOWN)
    .replace(/(\.\d*?[1-9])0+$/g, "$1")
    .replace(/\.0+$/, "");
}
