import { useMemo, useState } from "react";
import {
  Card,
  Button,
  Text,
  Row,
  Box,
  ChevronRight,
  Input
} from "~components/embed/ui";
import { useStorage, ExtensionStorage } from "~utils/storage";
import { useLocation } from "~wallets/router/router.utils";
import getSymbolFromCurrency from "currency-symbol-map";
import { useTransak } from "~utils/transak/transak.hooks";
import React from "react";
import {
  Bank,
  BankNote01,
  CreditCard01,
  Coins03
} from "@untitled-ui/icons-react";
import { paymentMethods } from "~utils/ramps";
import browser from "webextension-polyfill";
import { useInput } from "@arconnect/components-rebrand";
import AutosizeInput from "react-input-autosize";
import arLogo from "url:/assets/ecosystem/ar-logo.svg";

const TRANSAK_API_KEY = import.meta.env?.VITE_TRANSAK_API_KEY;

export function WalletBuyCashEmbeddedView() {
  const { navigate } = useLocation();
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const {
    purchaseAmount,
    arConversion,
    loading,
    invalidFiatAmount,
    selectedCurrency,
    paymentMethod,
    quote,
    error,
    currencies,

    setPaymentMethod,

    handleAmountChange,
    handleUpdateCurrency,
    createPurchaseUrl
  } = useTransak(TRANSAK_API_KEY, true);

  const openCurrencySelector = (e) => {
    e.preventDefault();
    setShowCurrencySelector(true);
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

  // Function to get display amount for USD/fiat equivalent
  const getDisplayAmount = () => {
    if (arConversion) {
      const symbol = getSymbolFromCurrency(selectedCurrency?.symbol || "USD");
      // If arConversion is true, show the fiat equivalent
      return `${symbol}${quote?.fiatAmount.toFixed(2) || "0.00"} ${
        selectedCurrency?.symbol || "USD"
      }`;
    } else {
      // If arConversion is false, show the AR equivalent
      return quote?.cryptoAmount
        ? `${quote.cryptoAmount.toFixed(6)} AR`
        : `0.00 AR`;
    }
  };

  const buyAR = async () => {
    try {
      const url = createPurchaseUrl(activeAddress);
      if (url) {
        navigate("/wallet/buy/success");
        window.open(url, "_blank");
      }
    } catch (error) {
      console.error("Error buying AR:", error);
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
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <AutosizeInput
          value={purchaseAmount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder="0"
          inputStyle={{
            fontSize: "40px",
            fontWeight: "500",
            color: "#121212",
            border: "none",
            background: "transparent"
          }}
        />
        <Text variant="bodyLg" style={{ fontWeight: "500" }}>
          {arConversion ? "AR" : selectedCurrency?.symbol || "USD"}
        </Text>
        <img
          src={arLogo}
          alt="AR"
          style={{ width: "16px", height: "16px", marginLeft: "4px" }}
        />
      </div>

      <Text variant="bodySm" style={{ color: "#666666", marginTop: "4px" }}>
        {getDisplayAmount()}
      </Text>

      <Button
        variant="link"
        onClick={openCurrencySelector}
        style={{ padding: 0, marginTop: "16px", width: "100%" }}
      >
        <Box hasBorder>
          <Row justifyContent="between" alignment="center">
            <Text variant="bodyMd" style={{ color: "#666666" }}>
              Currency
            </Text>
            <Row justifyContent="end">
              {selectedCurrency?.logo && (
                <img
                  src={selectedCurrency?.logo}
                  alt={selectedCurrency?.symbol}
                  style={{
                    width: "24px",
                    height: "24px",
                    objectFit: "contain",
                    borderRadius: "50%"
                  }}
                />
              )}
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
          <Row justifyContent="between" alignment="center">
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
        isLoading={loading}
        variant="primary"
        onClick={buyAR}
        isDisabled={
          !purchaseAmount || loading || invalidFiatAmount || !!error || !quote
        }
        style={{ marginTop: "16px" }}
      >
        {!quote
          ? browser.i18n.getMessage("enter_an_amount")
          : browser.i18n.getMessage("next")}
      </Button>
    </Card>
  );

  return (
    <>
      {renderMainView()}
      {showCurrencySelector && (
        <CurrencySelector
          currencies={currencies}
          selectedCurrency={selectedCurrency}
          handleUpdateCurrency={(currency, e) => {
            handleUpdateCurrency(currency);
            handleCurrencyClose(e);
          }}
          onClose={handleCurrencyClose}
        />
      )}
      {showPaymentSelector && selectedCurrency && (
        <PaymentSelector
          selectedCurrency={selectedCurrency}
          paymentMethod={paymentMethod}
          setPaymentMethod={(payment) => {
            setPaymentMethod(payment);
            handlePaymentClose();
          }}
          onClose={handlePaymentClose}
        />
      )}
    </>
  );
}

interface SelectorItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
}

interface SelectorContainerProps {
  title: string;
  onClose: (e?: React.MouseEvent) => void;
  children: React.ReactNode;
}

interface CurrencySelectorProps {
  currencies: any[];
  selectedCurrency: any;
  handleUpdateCurrency: (currency: any, e?: React.MouseEvent) => void;
  onClose: (e?: React.MouseEvent) => void;
}

interface PaymentSelectorProps {
  selectedCurrency: any;
  paymentMethod: any;
  setPaymentMethod: (payment: any) => void;
  onClose: (e?: React.MouseEvent) => void;
}

const SelectorItem = ({
  icon,
  title,
  subtitle,
  isSelected,
  onClick
}: SelectorItemProps) => (
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

// Card container for selectors
const SelectorContainer = ({
  title,
  onClose,
  children
}: SelectorContainerProps) => (
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

// Currency Selector Component
const CurrencySelector = ({
  currencies,
  selectedCurrency,
  handleUpdateCurrency,
  onClose
}: CurrencySelectorProps) => {
  const searchInput = useInput();

  const filteredCurrencies = useMemo(() => {
    if (!searchInput.state) {
      return currencies;
    }
    return currencies.filter((currency) => {
      const name = currency.name?.toLowerCase() || "";
      const symbol = currency.symbol?.toLowerCase() || "";
      const searchLower = searchInput.state.toLowerCase();
      return name.includes(searchLower) || symbol.includes(searchLower);
    });
  }, [currencies, searchInput.state]);

  return (
    <SelectorContainer title="Select Currency" onClose={onClose}>
      <div style={{ marginBottom: "16px", width: "100%" }}>
        <Input
          placeholder="Search currency"
          {...searchInput.bindings}
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
                objectFit: "contain",
                borderRadius: "50%"
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

// Payment Method Selector Component
const PaymentSelector = ({
  selectedCurrency,
  paymentMethod,
  setPaymentMethod,
  onClose
}: PaymentSelectorProps) => {
  return (
    <SelectorContainer title="Select Payment Method" onClose={onClose}>
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
          .filter((payment: any) => payment.isActive)
          .map((payment: any) => {
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
                title={paymentMethods(payment)}
                subtitle={`Processing time ${
                  payment.processingTime || "standard"
                }`}
                isSelected={payment.id === paymentMethod?.id}
                onClick={(e) => {
                  e.preventDefault();
                  setPaymentMethod(payment);
                  onClose(e);
                }}
              />
            );
          })}
      </div>
    </SelectorContainer>
  );
};
