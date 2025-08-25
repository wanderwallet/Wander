/**
 * Sort an array of letters, numbers, and/or symbols
 * in the order listed above
 *
 * @param options is an array to be sorted in order
 */

export const multiSort = (options) => {
  return options.sort((a, b) => {
    const aFirstChar = a.address.charAt(0);
    const bFirstChar = b.address.charAt(0);

    const getOrder = (char: string) => {
      if (char.match(/[A-Z]/i)) {
        return 0; // Letters first
      } else if (char.match(/[0-9]/)) {
        return 1; // Numbers second
      } else {
        return 2; // Other chars last
      }
    };

    const orderA = getOrder(aFirstChar);
    const orderB = getOrder(bFirstChar);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    if (!a.name && aFirstChar.match(/[0-9]/)) {
      return 1;
    }

    if (!b.name && bFirstChar.match(/[0-9]/)) {
      return -1;
    }

    return a.address.localeCompare(b.address);
  });
};
