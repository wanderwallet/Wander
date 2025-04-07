import { useState, useCallback, useEffect, useMemo } from "react";
import type { PaymentType, Quote } from "~lib/onramper";
import { useDebounce } from "~wallets/hooks";
import { retryWithDelay } from "~utils/promises/retry";
import browser from "webextension-polyfill";

export const BASE_URL = "https://api.transak.com";

export const useTransak = (apiKey: string, initialConversion = false) => {
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");
  const debouncedAmount = useDebounce(purchaseAmount, 300);
  const [arConversion, setArConversion] = useState<boolean>(initialConversion);
  const [loading, setLoading] = useState(false);
  const [invalidFiatAmount, setInvalidFiatAmount] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<any | null>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | null>();
  const [quote, setQuote] = useState<Quote | null>();
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [unavailableQuote, setUnavailableQuote] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Handle amount input change
  const handleAmountChange = (value: string) => {
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setPurchaseAmount(value);
    }
  };

  // Process quote result
  const finishUp = (quote: Quote | null) => {
    if (quote) {
      const rate = (quote.fiatAmount - quote.totalFee) / quote.cryptoAmount;
      setExchangeRate(rate);
      setUnavailableQuote(false);
    } else {
      setExchangeRate(0);
      setUnavailableQuote(true);
    }
    setQuote(quote);
    setLoading(false);
  };

  // Handle currency selection
  const handleUpdateCurrency = useCallback((currency: any) => {
    if (currency) {
      setSelectedCurrency(currency);
    }

    const activePaymentOptions = (currency?.paymentOptions ?? []).filter(
      (payment: any) => payment.isActive
    );
    setPaymentMethod(activePaymentOptions[0] || null);
  }, []);

  // Fetch available currencies
  useEffect(() => {
    const fetchCurrencies = async () => {
      const url = `${BASE_URL}/api/v2/currencies/fiat-currencies?apiKey=${apiKey}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const currencyInfo = data.response
          .filter((currency) => currency.isAllowed)
          .map((currency) => ({
            symbol: currency.symbol,
            logo: ["DZD", "CVE"].includes(currency.symbol)
              ? `https://kapowaz.github.io/square-flags/flags/${currency.logoSymbol.toLowerCase()}.svg`
              : `https://cdn.onramper.com/icons/tokens/${currency.symbol.toLowerCase()}.svg`,
            name: currency.name,
            paymentOptions: currency.paymentOptions
          }));
        setCurrencies(currencyInfo || []);
        setSelectedCurrency(currencyInfo[0]);
        setPaymentMethod(currencyInfo[0].paymentOptions[0]);
      } catch (error) {
        console.error("Failed to fetch currencies:", error);
      }
    };

    const fetchCountryCode = async () => {
      if (countryCode) return;
      try {
        const responseJson = await (
          await fetch(`${BASE_URL}/fiat/public/v1/get/country`)
        ).json();
        setCountryCode(responseJson.ipCountryCode);
      } catch {}
    };

    fetchCurrencies();
    fetchCountryCode();
  }, [apiKey]);

  // Fetch quote when amount changes
  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      setQuote(null);
      if (
        Number(debouncedAmount) <= 0 ||
        debouncedAmount === "" ||
        !selectedCurrency ||
        !paymentMethod
      ) {
        finishUp(null);
        return;
      }
      if (
        !arConversion &&
        (+debouncedAmount > paymentMethod.maxAmount ||
          +debouncedAmount < paymentMethod.minAmount)
      ) {
        const isExceedMaxAmount = +debouncedAmount > paymentMethod.maxAmount;
        setError(
          browser.i18n.getMessage(
            isExceedMaxAmount ? "max_buy_amount" : "min_buy_amount",
            [
              isExceedMaxAmount
                ? paymentMethod.maxAmount
                : paymentMethod.minAmount,
              selectedCurrency?.symbol
            ]
          )
        );
        finishUp(null);
        return;
      }
      const baseUrl = `${BASE_URL}/api/v1/pricing/public/quotes`;
      const params = new URLSearchParams({
        partnerApiKey: apiKey,
        fiatCurrency: selectedCurrency?.symbol,
        cryptoCurrency: "AR",
        isBuyOrSell: "BUY",
        network: "mainnet",
        paymentMethod: paymentMethod.id
      });
      if (arConversion) {
        params.append("cryptoAmount", debouncedAmount);
      } else {
        params.append("fiatAmount", debouncedAmount);
      }

      if (countryCode) {
        params.append("quoteCountryCode", countryCode);
      }

      const url = `${baseUrl}?${params.toString()}`;

      try {
        const response = await retryWithDelay(() => fetch(url));
        if (!response.ok) {
          try {
            const resJson = await response.json();
            if (resJson?.error?.message) {
              setError(resJson?.error?.message);
            } else {
              throw new Error("Network response was not ok");
            }
          } catch {
            setError(browser.i18n.getMessage("transak_unavailable"));
          }
          finishUp(null);
          return;
        }
        setError(null);
        const data = await response.json();
        const updatedQuote = data.response as Quote;
        finishUp(updatedQuote);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(browser.i18n.getMessage("transak_unavailable"));
        finishUp(null);
      }
    };

    if (debouncedAmount) {
      fetchQuote();
    } else {
      setQuote(null);
      setExchangeRate(0);
      setUnavailableQuote(false);
    }
  }, [debouncedAmount, selectedCurrency, paymentMethod, arConversion, apiKey]);

  // Update validation when AR conversion changes
  useEffect(() => {
    if (
      arConversion &&
      quote &&
      paymentMethod &&
      (quote.fiatAmount > paymentMethod.maxAmount ||
        quote.fiatAmount < paymentMethod.minAmount)
    ) {
      const isExceedMaxAmount = quote.fiatAmount > paymentMethod.maxAmount;
      setError(
        browser.i18n.getMessage(
          isExceedMaxAmount ? "max_buy_amount" : "min_buy_amount",
          [
            isExceedMaxAmount
              ? paymentMethod.maxAmount
              : paymentMethod.minAmount,
            selectedCurrency?.symbol
          ]
        )
      );
      setInvalidFiatAmount(true);
    } else {
      setInvalidFiatAmount(false);
    }
  }, [quote, arConversion, paymentMethod, selectedCurrency]);

  // Reset exchange rate when currency changes
  useEffect(() => {
    setExchangeRate(0);
  }, [selectedCurrency]);

  // Create a Transak purchase URL
  const createPurchaseUrl = (walletAddress: string) => {
    if (!quote) return null;

    const baseUrl = "https://global.transak.com/";
    const params = new URLSearchParams({
      apiKey: apiKey,
      defaultCryptoCurrency: "AR",
      defaultFiatAmount: quote.fiatAmount.toString(),
      defaultFiatCurrency: quote.fiatCurrency,
      walletAddress: walletAddress,
      defaultPaymentMethod: quote.paymentMethod
    });

    return `${baseUrl}?${params.toString()}`;
  };

  return {
    // State
    purchaseAmount,
    arConversion,
    loading,
    invalidFiatAmount,
    currencies,
    selectedCurrency,
    paymentMethod,
    quote,
    exchangeRate,
    unavailableQuote,
    error,

    // Setters
    setPurchaseAmount,
    setArConversion,
    setPaymentMethod,

    // Actions
    handleAmountChange,
    handleUpdateCurrency,
    createPurchaseUrl
  };
};
