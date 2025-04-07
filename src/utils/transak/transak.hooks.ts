import { useState, useCallback, useEffect, useMemo } from "react";
import type { PaymentType, Quote } from "~lib/onramper";
import { useDebounce } from "~wallets/hooks";
import { retryWithDelay } from "~utils/promises/retry";
import browser from "webextension-polyfill";
import { useStorage, ExtensionStorage } from "~utils/storage";
import { useLocation } from "~wallets/router/router.utils";
import type { WanderRoutePath } from "~wallets/router/router.types";
import getSymbolFromCurrency from "currency-symbol-map";
import { IS_EMBEDDED_APP } from "~utils/embedded/embedded.constants";

export const BASE_URL = "https://api.transak.com";

export const useTransak = (apiKey: string, initialConversion = false) => {
  const { navigate } = useLocation();
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
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  // Handle amount input change
  const handleAmountChange = useCallback((value: string) => {
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setPurchaseAmount(value);
    }
  }, []);

  // Process quote result
  const finishUp = useCallback((quote: Quote | null) => {
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
  }, []);

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

  // Function to get display amount for USD/fiat equivalent
  const getDisplayAmount = useCallback(() => {
    if (arConversion) {
      const symbol = getSymbolFromCurrency(selectedCurrency?.symbol || "USD");
      // If arConversion is true, show the fiat equivalent
      return `${symbol}${quote?.fiatAmount.toFixed(2) || "0.00"} ${
        selectedCurrency?.symbol || "USD"
      }`;
    } else {
      // If arConversion is false, show the AR equivalent
      return `${quote?.cryptoAmount.toFixed(6) || "0.00"} AR`;
    }
  }, [arConversion, selectedCurrency, quote]);

  const fetchQuote = useCallback(async () => {
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
  }, [
    apiKey,
    debouncedAmount,
    selectedCurrency,
    paymentMethod,
    arConversion,
    countryCode
  ]);

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
    if (debouncedAmount) {
      fetchQuote();
    } else {
      setQuote(null);
      setExchangeRate(0);
      setUnavailableQuote(false);
    }
  }, [debouncedAmount, fetchQuote]);

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
  const createPurchaseUrl = useCallback(
    (walletAddress: string) => {
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
    },
    [apiKey, quote]
  );

  const openCurrencySelector = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowCurrencySelector(true);
  }, []);

  const openPaymentSelector = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowPaymentSelector(true);
  }, []);

  const closeCurrencySelector = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowCurrencySelector(false);
  }, []);

  const closePaymentSelector = useCallback((e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowPaymentSelector(false);
  }, []);

  const openTransak = useCallback(
    async (navigateTo: string) => {
      try {
        const url = createPurchaseUrl(activeAddress);
        if (url) {
          if (IS_EMBEDDED_APP) {
            window.open(url, "_blank");
          } else {
            browser.tabs.create({ url });
          }
          navigate(navigateTo as WanderRoutePath);
        }
      } catch (error) {
        console.error("Error buying AR:", error);
      }
    },
    [activeAddress, createPurchaseUrl, navigate]
  );

  return {
    // State
    activeAddress,
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
    showCurrencySelector,
    showPaymentSelector,

    // Setters
    setPurchaseAmount,
    setArConversion,
    setPaymentMethod,
    setShowCurrencySelector,
    setShowPaymentSelector,

    // Actions
    handleAmountChange,
    handleUpdateCurrency,
    createPurchaseUrl,
    openCurrencySelector,
    openPaymentSelector,
    closeCurrencySelector,
    closePaymentSelector,
    openTransak,
    getDisplayAmount
  };
};
