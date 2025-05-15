import { Button, Text, Row, ChevronRight } from "~components/embed/ui";
import { useLocation } from "~wallets/router/router.utils";
import { useTransak } from "~utils/transak/transak.hooks";
import browser from "webextension-polyfill";
import AutosizeInput from "react-input-autosize";
import arLogo from "url:/assets/ecosystem/ar-logo.svg";
import { PaymentSelector, CurrencySelector } from "./components/selector";
import { OnboardingCard } from "~components/embed/ui/molecules/card/onboarding-card/OnboardingCard";

import styles from "./buy.module.scss";
import { DefaultCard } from "~components/embed/ui/molecules/card/default-card/DefaultCard";

const TRANSAK_API_KEY = import.meta.env?.VITE_TRANSAK_API_KEY;

export function WalletBuyCashEmbeddedView() {
  const { navigate } = useLocation();

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
    showCurrencySelector,
    showPaymentSelector,
    setPaymentMethod,
    handleAmountChange,
    handleUpdateCurrency,
    openCurrencySelector,
    openPaymentSelector,
    closeCurrencySelector,
    closePaymentSelector,
    openTransak,
    getDisplayAmount,
  } = useTransak(TRANSAK_API_KEY, true);

  const renderMainView = () => (
    <DefaultCard
      headerText="Buy Tokens"
      hasFooter
      onBackButtonClick={() => navigate("/wallet/receive/options")}>

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
            background: "transparent",
          }}
        />
        <Text variant="bodyLg" style={{ fontWeight: "500" }}>
          {arConversion ? "AR" : selectedCurrency?.symbol || "USD"}
        </Text>
        <img src={arLogo} alt="AR" style={{ width: "16px", height: "16px", marginLeft: "4px" }} />
      </div>

      <Text variant="bodySm" style={{ color: "#666666", marginTop: "4px" }}>
        {getDisplayAmount()}
      </Text>

      <button className={ styles.buttonDropdown } onClick={openCurrencySelector}>
        <Text variant="bodyMd" style={{ color: "var(--color-divider-text)" }}>
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
                borderRadius: "50%",
              }}
            />
          )}
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            {selectedCurrency?.symbol || "USD"}
          </Text>
          <ChevronRight fontSize={24} color={"#121212"} />
        </Row>
      </button>

      <button className={ styles.buttonDropdown } onClick={openPaymentSelector}>
        <Text variant="bodyMd" style={{ color: "#666666" }}>
          Payment
        </Text>

        <Row justifyContent="end">
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            {paymentMethod?.name || "Credit or Debit Card"}
          </Text>
          <ChevronRight fontSize={24} color={"#121212"} />
        </Row>
      </button>

      {error && (
        <Text variant="bodySm" style={{ color: "red", marginTop: "8px", marginBottom: "8px" }}>
          {error}
        </Text>
      )}

      <Button
        isLoading={loading}
        variant="primary"
        onClick={() => openTransak("/wallet/buy/success")}
        isDisabled={!purchaseAmount || loading || invalidFiatAmount || !!error || !quote}
        style={{ marginTop: " var(--spacing-3)" }}>
        {!quote ? browser.i18n.getMessage("enter_an_amount") : browser.i18n.getMessage("next")}
      </Button>
    </DefaultCard>
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
            closeCurrencySelector(e);
          }}
          onClose={closeCurrencySelector}
        />
      )}
      {showPaymentSelector && selectedCurrency && (
        <PaymentSelector
          selectedCurrency={selectedCurrency}
          paymentMethod={paymentMethod}
          setPaymentMethod={(payment) => {
            setPaymentMethod(payment);
            closePaymentSelector();
          }}
          onClose={closePaymentSelector}
        />
      )}
    </>
  );
}
