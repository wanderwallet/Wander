import { useMemo } from "react";
import { formatFiatBalance } from "~tokens/currency";
import { formatBalance } from "~utils/format";
import { useAoToken, useTokenBalance, useTokenPrice } from ".";
import { useActiveAddress } from "~wallets/hooks";
import useSetting from "~settings/hook";
import BigNumber from "bignumber.js";

export function useFormattedTokenBalance(id: string) {
  const token = useAoToken(id);
  const activeAddress = useActiveAddress();
  const { data: balance = "0", isFetched: balanceLoaded } = useTokenBalance(token, activeAddress);
  const [currency = "USD"] = useSetting("currency");
  const { price = 0, loading } = useTokenPrice(id, currency);

  const formattedBalance = useMemo(() => formatBalance(balance), [balance]);

  const fiat = useMemo(() => (price ? BigNumber(price).multipliedBy(balance) : null), [price, balance]);

  return {
    displayBalance: formattedBalance.displayBalance,
    fiatBalance: fiat ? formatFiatBalance(fiat, currency) : null,
    fiat,
    loading: loading || !balanceLoaded,
  };
}
