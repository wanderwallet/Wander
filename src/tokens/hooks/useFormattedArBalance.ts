import { useMemo } from "react";
import { useArPrice } from "~lib/coingecko";
import { formatFiatBalance } from "~tokens/currency";
import { formatBalance } from "~utils/format";
import { useTokenBalance } from ".";
import { useActiveAddress } from "~wallets/hooks";
import { defaultTokens } from "~tokens/aoTokens/ao";
import useSetting from "~settings/hook";
import BigNumber from "bignumber.js";

const arToken = defaultTokens[0];

export function useFormattedArBalance() {
  const activeAddress = useActiveAddress();
  const { data: balance = "0", isFetched: balanceLoaded } = useTokenBalance(arToken, activeAddress);
  const [currency = "USD"] = useSetting("currency");
  const { data: price = "0", isLoading: loading } = useArPrice(currency);

  const formattedBalance = useMemo(() => formatBalance(balance), [balance]);

  const fiat = useMemo(() => BigNumber(price).multipliedBy(balance), [price, balance]);

  return {
    displayBalance: formattedBalance.displayBalance,
    fiatBalance: formatFiatBalance(fiat, currency),
    fiat,
    loading: loading || !balanceLoaded,
  };
}
