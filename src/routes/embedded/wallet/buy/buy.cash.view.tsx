import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import {
  Card,
  Button,
  Text,
  Row,
  Box,
  ChevronRight,
  Input
} from "~components/embed/ui";
import type { PaymentType, Quote } from "~lib/onramper";
import { useStorage, ExtensionStorage } from "~utils/storage";
import { useDebounce } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import browser from "webextension-polyfill";
import { retryWithDelay } from "~utils/promises/retry";
import { paymentMethods } from "~utils/ramps";
import {
  Bank,
  BankNote01,
  CreditCard01,
  Coins03
} from "@untitled-ui/icons-react";
import getSymbolFromCurrency from "currency-symbol-map";

const BASE_URL = "https://api.transak.com";
const TRANSAK_API_KEY = import.meta.env?.VITE_TRANSAK_API_KEY;

const SelectorItem = ({ icon, title, subtitle, isSelected, onClick }) => (
  <Button
    variant="link"
    onClick={onClick}
    style={{
      padding: 0,
      marginBottom: "8px",
      width: "100%",
      height: "auto",
      minHeight: "64px"
    }}
  >
    <Box
      hasBorder
      style={{
        padding: "12px",
        width: "100%",
        height: "100%"
      }}
    >
      <Row
        justifyContent="between"
        alignment="center"
        style={{
          width: "100%",
          height: "100%"
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: "calc(100% - 24px)",
            height: "100%"
          }}
        >
          <div
            style={{
              minWidth: "32px",
              width: "32px",
              height: "32px",
              marginRight: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0
            }}
          >
            {icon}
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              overflow: "hidden"
            }}
          >
            <Text
              variant="bodyMd"
              style={{
                fontWeight: "500",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%"
              }}
            >
              {title}
            </Text>
            <Text
              variant="bodySm"
              style={{
                color: "#666666",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%"
              }}
            >
              {subtitle}
            </Text>
          </div>
        </div>
        {isSelected && (
          <Text
            variant="bodyMd"
            style={{
              color: "var(--color-accent)",
              flexShrink: 0
            }}
          >
            ✓
          </Text>
        )}
      </Row>
    </Box>
  </Button>
);

const SelectorContainer = ({ title, onClose, children }) => (
  <div
    className="selector-overlay"
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1000,
      backgroundColor: "var(--color-card-background-default)"
    }}
  >
    <Card
      size="auto"
      headerText={title}
      hasBackButton={true}
      onBackButtonClick={onClose}
      style={{
        height: "100%",
        width: "100%",
        padding: "32px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {children}
    </Card>
  </div>
);

export function WalletBuyCashEmbeddedView() {
  const { navigate } = useLocation();
  const [purchaseAmount, setPurchaseAmount] = useState<string>("");
  const debouncedPurchaseAmount = useDebounce(purchaseAmount, 300);
  const [arConversion, setArConversion] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [invalidFiatAmount, setInvalidFiatAmount] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<any | null>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentType | null>();
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [quote, setQuote] = useState<Quote | null>();
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [unavailableQuote, setUnavailableQuote] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currencySearch, setCurrencySearch] = useState("");

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const filteredCurrencies = useMemo(() => {
    if (!currencySearch) return currencies;

    const searchLower = currencySearch.toLowerCase();
    return currencies.filter((currency) => {
      const name = currency.name?.toLowerCase() || "";
      const symbol = currency.symbol?.toLowerCase() || "";
      return name.includes(searchLower) || symbol.includes(searchLower);
    });
  }, [currencies, currencySearch]);

  const handlePurchaseChange = (value: string) => {
    if (/^(\d*\.?\d*)$/.test(value) || value === "") {
      setPurchaseAmount(value);
    }
  };

  const openCurrencySelector = (e) => {
    e.preventDefault();
    setShowCurrencySelector(true);
    setCurrencySearch("");
  };

  const openPaymentSelector = (e) => {
    e.preventDefault();
    setShowPaymentSelector(true);
  };

  const handleCurrencyClose = (e?) => {
    if (e) {
      e.preventDefault();
    }
    setShowCurrencySelector(false);
  };

  const handlePaymentClose = (e?) => {
    if (e) {
      e.preventDefault();
    }
    setShowPaymentSelector(false);
  };

  const showTransakErrorToast = () => {
    setError(browser.i18n.getMessage("transak_unavailable"));
  };

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

  const handleUpdateCurrency = useCallback((currency: any, e?) => {
    if (e) {
      e.preventDefault();
    }

    if (currency) {
      setSelectedCurrency(currency);
    }

    const activePaymentOptions = (currency?.paymentOptions ?? []).filter(
      (payment: any) => payment.isActive
    );
    setPaymentMethod(activePaymentOptions[0] || null);
    handleCurrencyClose();
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      const url = `${BASE_URL}/api/v2/currencies/fiat-currencies?apiKey=${TRANSAK_API_KEY}`;
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

    async function fetchCountryCode() {
      if (countryCode) return;
      try {
        const responseJson = await (
          await fetch(`${BASE_URL}/fiat/public/v1/get/country`)
        ).json();
        setCountryCode(responseJson.ipCountryCode);
      } catch {}
    }

    fetchCurrencies();
    fetchCountryCode();
  }, []);

  useEffect(() => {
    const fetchQuote = async () => {
      setLoading(true);
      setQuote(null);
      if (
        Number(debouncedPurchaseAmount) <= 0 ||
        debouncedPurchaseAmount === "" ||
        !selectedCurrency ||
        !paymentMethod
      ) {
        finishUp(null);
        return;
      }
      if (
        !arConversion &&
        (+debouncedPurchaseAmount > paymentMethod.maxAmount ||
          +debouncedPurchaseAmount < paymentMethod.minAmount)
      ) {
        const isExceedMaxAmount =
          +debouncedPurchaseAmount > paymentMethod.maxAmount;
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
        partnerApiKey: TRANSAK_API_KEY,
        fiatCurrency: selectedCurrency?.symbol,
        cryptoCurrency: "AR",
        isBuyOrSell: "BUY",
        network: "mainnet",
        paymentMethod: paymentMethod.id
      });
      if (arConversion) {
        params.append("cryptoAmount", debouncedPurchaseAmount);
      } else {
        params.append("fiatAmount", debouncedPurchaseAmount);
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
            showTransakErrorToast();
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
        showTransakErrorToast();
        finishUp(null);
      }
      setLoading(false);
    };

    if (debouncedPurchaseAmount) {
      fetchQuote();
    } else {
      setQuote(null);
      setExchangeRate(0);
      setUnavailableQuote(false);
    }
  }, [debouncedPurchaseAmount, selectedCurrency, paymentMethod, arConversion]);

  useEffect(() => {
    setExchangeRate(0);
  }, [selectedCurrency]);

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

  const buyAR = async () => {
    try {
      const baseUrl = "https://global.transak.com/";
      const params = new URLSearchParams({
        apiKey: TRANSAK_API_KEY,
        defaultCryptoCurrency: "AR",
        defaultFiatAmount: quote.fiatAmount.toString(),
        defaultFiatCurrency: quote.fiatCurrency,
        walletAddress: activeAddress,
        defaultPaymentMethod: quote.paymentMethod
      });
      const url = `${baseUrl}?${params.toString()}`;
      window.open(url, "_blank");
      navigate("/wallet/buy/success");
    } catch (error) {
      console.error("Error buying AR:", error);
    }
  };

  const getDisplayAmount = () => {
    if (arConversion) {
      const symbol = getSymbolFromCurrency(selectedCurrency?.symbol || "USD");
      // If arConversion is true, show the fiat equivalent
      return quote?.fiatAmount
        ? `${symbol}${quote.fiatAmount.toFixed(2)} ${
            selectedCurrency?.symbol || "USD"
          }`
        : `${symbol}${
            purchaseAmount ? Number(purchaseAmount).toFixed(2) : "0.00"
          } ${selectedCurrency?.symbol || "USD"}`;
    } else {
      // If arConversion is false, show the AR equivalent
      return quote?.cryptoAmount
        ? `${quote.cryptoAmount.toFixed(6)} AR`
        : `0.00 AR`;
    }
  };

  const renderMainView = () => (
    <Card
      size="auto"
      headerText="Buy Tokens"
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet")}
      style={{ padding: "32px" }}
    >
      <Input
        value={purchaseAmount}
        onChange={(e) => handlePurchaseChange(e.target.value)}
        placeholder="0.00"
        isCentered={true}
        autoSize={true}
        style={{
          fontSize: "32px",
          fontWeight: "500",
          color: "#121212",
          border: "none",
          padding: "8px 0",
          background: "transparent"
        }}
      />
      <Text variant="bodyLg" style={{ fontWeight: "500" }}>
        {arConversion ? "AR" : selectedCurrency?.symbol || "USD"}
      </Text>
      <Text variant="bodySm" style={{ color: "#666666", marginTop: "4px" }}>
        {getDisplayAmount()}
      </Text>

      <Button
        variant="link"
        onClick={openCurrencySelector}
        style={{ padding: 0, marginTop: "16px", width: "100%" }}
      >
        <Box hasBorder>
          <Row justifyContent="between">
            <Text variant="bodyMd" style={{ color: "#666666" }}>
              Currency
            </Text>
            <Row justifyContent="end">
              <Text variant="bodyMd" style={{ color: "#121212" }}>
                {selectedCurrency?.symbol || "USD"}
              </Text>
              <ChevronRight fontSize={24} color={"#121212"} />
            </Row>
          </Row>
        </Box>
      </Button>
      <Button
        variant="link"
        onClick={openPaymentSelector}
        style={{ padding: 0, marginTop: "16px", width: "100%" }}
      >
        <Box hasBorder>
          <Row justifyContent="between">
            <Text variant="bodyMd" style={{ color: "#666666" }}>
              Payment
            </Text>
            <Row justifyContent="end">
              <Text variant="bodyMd" style={{ color: "#121212" }}>
                {paymentMethod?.name || "Credit or Debit Card"}
              </Text>
              <ChevronRight fontSize={24} color={"#121212"} />
            </Row>
          </Row>
        </Box>
      </Button>

      {error && (
        <Text
          variant="bodySm"
          style={{ color: "red", marginTop: "8px", marginBottom: "8px" }}
        >
          {error}
        </Text>
      )}
      <Button
        variant="primary"
        onClick={buyAR}
        isDisabled={
          !purchaseAmount || loading || invalidFiatAmount || !!error || !quote
        }
        style={{ marginTop: "16px" }}
      >
        {loading ? "Loading..." : !quote ? "Enter an amount" : "Next"}
      </Button>
    </Card>
  );

  const CurrencySelector = () => {
    return (
      <SelectorContainer title="Select Currency" onClose={handleCurrencyClose}>
        <div style={{ marginBottom: "16px", width: "100%" }}>
          <Input
            placeholder="Search currency"
            value={currencySearch}
            onChange={(e) => setCurrencySearch(e.target.value)}
            isFullWidth
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border-default)"
            }}
          />
        </div>

        <div
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "100%",
            height: "100%",
            maxHeight: "calc(100% - 60px)"
          }}
        >
          {filteredCurrencies.map((currency) => {
            const currencyIcon = currency.logo ? (
              <img
                src={currency.logo}
                alt={currency.name}
                style={{
                  width: "24px",
                  height: "24px",
                  objectFit: "contain"
                }}
              />
            ) : (
              <Coins03 color="var(--color-accent)" />
            );

            return (
              <SelectorItem
                key={currency.symbol}
                icon={currencyIcon}
                title={currency.symbol}
                subtitle={currency.name}
                isSelected={currency.symbol === selectedCurrency?.symbol}
                onClick={(e) => handleUpdateCurrency(currency, e)}
              />
            );
          })}
        </div>
      </SelectorContainer>
    );
  };

  const PaymentMethodSelector = () => {
    return (
      <SelectorContainer
        title="Select Payment Method"
        onClose={handlePaymentClose}
      >
        <div
          style={{
            overflowY: "auto",
            overflowX: "hidden",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            width: "100%",
            height: "100%",
            maxHeight: "calc(100% - 16px)"
          }}
        >
          {(selectedCurrency?.paymentOptions || [])
            .filter((payment) => payment.isActive)
            .map((payment) => {
              const isWireTransfer = payment.id === "pm_us_wire_bank_transfer";
              const isCashApp = payment.id === "pm_cash_app";

              let paymentIcon;
              if (isWireTransfer) {
                paymentIcon = <Bank color="var(--color-accent)" />;
              } else if (isCashApp) {
                paymentIcon = <BankNote01 color="var(--color-accent)" />;
              } else if (payment.icon) {
                paymentIcon = (
                  <img
                    src={payment.icon}
                    alt={payment.name}
                    style={{
                      width: "24px",
                      height: "24px",
                      objectFit: "contain"
                    }}
                  />
                );
              } else {
                paymentIcon = <CreditCard01 color="var(--color-accent)" />;
              }

              return (
                <SelectorItem
                  key={payment.id}
                  icon={paymentIcon}
                  title={paymentMethods(payment) || payment.name}
                  subtitle={`Processing time ${
                    payment.processingTime || "standard"
                  }`}
                  isSelected={payment.id === paymentMethod?.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setPaymentMethod(payment);
                    handlePaymentClose(e);
                  }}
                />
              );
            })}
        </div>
      </SelectorContainer>
    );
  };

  return (
    <>
      {renderMainView()}
      {showCurrencySelector && <CurrencySelector />}
      {showPaymentSelector && selectedCurrency && <PaymentMethodSelector />}
    </>
  );
}
