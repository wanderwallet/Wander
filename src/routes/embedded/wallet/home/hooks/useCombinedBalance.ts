import BigNumber from "bignumber.js";
import { useEffect, useMemo, useState, useRef } from "react";
import { getAr24hChange, useArPrice } from "~lib/coingecko";
import { ExtensionStorage } from "~utils/storage";
import useSetting from "~settings/hook";
import { useTotalFiatBalance } from "~tokens/hooks";
import { useStorage } from "~utils/storage";
import { useBalance } from "~wallets/hooks";

export function useCombinedBalance() {
  const [percentage, setPercentage] = useState(BigNumber("0"));
  const [fiatBalance, setFiatBalance] = useState(0);

  const totalFiatBalance = useTotalFiatBalance();

  const [currency] = useSetting<string>("currency");

  const { data: balance = "0", isLoading } = useBalance();
  const { data: price = "0" } = useArPrice(currency);

  const fiat = useMemo(
    () => BigNumber(price).multipliedBy(balance || BigNumber("0")),
    [price, balance]
  );

  const [savedAr24hChange, setSavedAr24hChange] = useStorage<{
    value: number;
    timestamp: string;
  }>({
    key: "saved_ar_24h_change",
    instance: ExtensionStorage
  });

  const savedAr24hChangeRef = useRef(savedAr24hChange);

  useEffect(() => {
    savedAr24hChangeRef.current = savedAr24hChange;
  }, [savedAr24hChange]);

  useEffect(() => {
    if (!currency) return;

    const fetchAr24hChange = async () => {
      try {
        if (balance === "0") {
          setPercentage(BigNumber(0));
          return;
        }
        const ar24hChange = await getAr24hChange(currency);

        setSavedAr24hChange({
          value: ar24hChange,
          timestamp: Date.now().toString()
        });

        setPercentage(BigNumber(ar24hChange));
      } catch (error) {
        console.error("Error fetching AR 24h change:", error);

        const latestSavedValue = savedAr24hChangeRef.current;
        if (latestSavedValue && latestSavedValue.value !== undefined) {
          setPercentage(BigNumber(latestSavedValue.value));
        } else {
          setPercentage(BigNumber(0));
        }
      }
    };

    fetchAr24hChange();
  }, [balance, currency, setSavedAr24hChange]);

  useEffect(() => {
    setFiatBalance(totalFiatBalance.toNumber());
  }, [totalFiatBalance]);

  return {
    percentage,
    fiatBalance,
    fiat,
    balance,
    isLoading
  };
}
