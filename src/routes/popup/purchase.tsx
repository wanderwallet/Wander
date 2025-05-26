import { Text, Input, useInput, Section, Button, Loading, ListItem, ListItemIcon } from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import { Bank, BankNote01, ChevronDown, SwitchVertical02 } from "@untitled-ui/icons-react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useEffect, useMemo } from "react";
import { PageType, trackPage } from "~utils/analytics";
import { ExtensionStorage } from "~utils/storage";
import SliderMenu from "~components/SliderMenu";
import { useTheme } from "styled-components";
import arLogo from "url:/assets/ecosystem/ar-logo.svg";
import CommonImage from "~components/common/Image";
import getSymbolFromCurrency from "currency-symbol-map";
import { WarningIcon } from "~components/popup/Token";
import { Flex } from "~components/common/Flex";
import { useTransak } from "~utils/transak/transak.hooks";
import { paymentMethods } from "~utils/ramps";
import { PopupPaths } from "~wallets/router/popup/popup.routes";
import { InputButton } from "~components/common/InputButton";

const TRANSAK_API_KEY = process.env.PLASMO_PUBLIC_TRANSAK_API_KEY;

export function PurchaseView() {
  const theme = useTheme();

  const {
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
    setPurchaseAmount,
    setArConversion,
    setPaymentMethod,
    handleUpdateCurrency,
    handleAmountChange,
    openCurrencySelector,
    openPaymentSelector,
    closeCurrencySelector,
    closePaymentSelector,
    showCurrencySelector,
    showPaymentSelector,
    openTransak,
  } = useTransak(TRANSAK_API_KEY, false);

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = input.value.replace(/[^0-9.]/g, "");
  };

  //segment
  useEffect(() => {
    trackPage(PageType.TRANSAK_PURCHASE);
  }, []);

  return (
    <>
      <HeadV2 title="Buy" />
      <Wrapper>
        <Top>
          {(unavailableQuote || invalidFiatAmount) && error && (
            <WarningWrapper>
              <WarningContent>
                <WarningIcon /> {error}
              </WarningContent>
            </WarningWrapper>
          )}
          <Input
            stacked
            sizeVariant="large"
            value={purchaseAmount}
            onInput={handleInputChange}
            onChange={(e) => handleAmountChange(e.target.value)}
            inputMode="numeric"
            placeholder={arConversion ? "0" : `${getSymbolFromCurrency(selectedCurrency?.symbol) || ""}0`}
            fullWidth
            hasRightIcon
            iconLeft={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  marginRight: "10px",
                  cursor: "default",
                }}>
                <Text size="sm" noMargin weight="medium" variant="secondary">
                  {arConversion
                    ? browser.i18n.getMessage("buy_screen_receive")
                    : browser.i18n.getMessage("buy_screen_pay")}
                </Text>
              </div>
            }
            iconRight={
              <div style={{ marginTop: 20 }}>
                {arConversion ? (
                  <AR />
                ) : (
                  <Tag
                    onClick={openCurrencySelector}
                    currency={selectedCurrency?.symbol || ""}
                    currencyLogo={selectedCurrency?.logo || ""}
                    iconColor={theme.secondaryText}
                  />
                )}
              </div>
            }
            inputContainerStyle={{
              background: theme.surfaceTertiary,
              height: "90px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexDirection: "column",
              padding: "10px",
              color: arConversion
                ? quote?.fiatAmount.toString()
                  ? theme.primaryTextv2
                  : theme.input.placeholder.search
                : quote?.cryptoAmount.toString()
                  ? theme.primaryTextv2
                  : theme.input.placeholder.search,
            }}
            inputStyle={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          />
          <Switch
            onClick={() => {
              if (quote) {
                if (arConversion) {
                  setPurchaseAmount(quote.fiatAmount.toString());
                } else {
                  setPurchaseAmount(quote.cryptoAmount.toString());
                }
              }
              setArConversion(!arConversion);
            }}>
            <SwitchVertical02 height={20} color={theme.primaryText} />
          </Switch>
          <InputButton
            style={{
              background: theme.surfaceTertiary,
              height: "90px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
            innerStyle={{
              fontSize: "40px",
              color: arConversion
                ? quote?.fiatAmount.toString()
                  ? theme.primaryTextv2
                  : theme.input.placeholder.search
                : quote?.cryptoAmount.toString()
                  ? theme.primaryTextv2
                  : theme.input.placeholder.search,
            }}
            disabled={!arConversion}
            label={
              arConversion ? browser.i18n.getMessage("buy_screen_pay") : browser.i18n.getMessage("buy_screen_receive")
            }
            onClick={openCurrencySelector}
            body={
              loading ? (
                <Loading />
              ) : arConversion ? (
                `${getSymbolFromCurrency(selectedCurrency?.symbol) || ""}${quote?.fiatAmount.toFixed(2) ?? "0"}`
              ) : (
                (quote?.cryptoAmount.toString() ?? "0")
              )
            }
            icon={
              !arConversion ? (
                <AR />
              ) : (
                <Tag
                  currency={selectedCurrency?.symbol || ""}
                  currencyLogo={selectedCurrency?.logo || ""}
                  onClick={openCurrencySelector}
                  iconColor={theme.secondaryText}
                />
              )
            }
          />
          {exchangeRate && purchaseAmount ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}>
              <Label
                style={{
                  paddingTop: "14px",
                  paddingBottom: "0px",
                  fontSize: "14px",
                }}>
                {browser.i18n.getMessage("exchange_message")}
              </Label>
              <Label
                style={{
                  paddingTop: "14px",
                  paddingBottom: "0px",
                  fontSize: "14px",
                  margin: "right",
                }}
                outer>
                {getSymbolFromCurrency(selectedCurrency?.symbol) || ""}
                {exchangeRate.toFixed(2)} = 1 AR
              </Label>
            </div>
          ) : (
            ""
          )}
          <Line margin="24px" />
          <InputButton
            style={{ background: theme.surfaceTertiary }}
            label={browser.i18n.getMessage("buy_screen_payment_method_label")}
            onClick={openPaymentSelector}
            disabled={!paymentMethod}
            body={paymentMethods(paymentMethod)}
            icon={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                <ChevronDown onClick={openPaymentSelector} />
              </div>
            }
            outerLabel
          />

          <SliderMenu
            title={browser.i18n.getMessage("currency")}
            isOpen={showCurrencySelector}
            onClose={closeCurrencySelector}>
            <CurrencySelectorScreen
              onClose={closeCurrencySelector}
              updateCurrency={handleUpdateCurrency}
              currencies={currencies}
            />
          </SliderMenu>

          <SliderMenu
            title={browser.i18n.getMessage("buy_screen_payment_method")}
            isOpen={showPaymentSelector}
            onClose={closePaymentSelector}>
            <PaymentSelectorScreen
              payments={selectedCurrency?.paymentOptions}
              updatePayment={setPaymentMethod}
              onClose={closePaymentSelector}
            />
          </SliderMenu>
        </Top>
        <Button
          disabled={!quote || invalidFiatAmount}
          fullWidth
          onClick={async () => {
            await ExtensionStorage.set("transak_quote", quote);
            await openTransak(PopupPaths.PendingPurchase);
          }}>
          {!quote ? "Enter amount" : "Review"}
        </Button>
      </Wrapper>
    </>
  );
}

const AR = () => {
  return (
    <div
      style={{
        cursor: "default",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "4px",
      }}>
      <TokenLogo src={arLogo} />
      <Text noMargin>AR</Text>
    </div>
  );
};

const Tag = ({
  currency,
  currencyLogo,
  iconColor,
  onClick,
}: {
  currency: string;
  currencyLogo: string;
  iconColor: string;
  onClick: () => void;
}) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
      onClick={onClick}>
      <TokenLogo src={currencyLogo} />
      <Text weight="medium" noMargin>
        {currency}
      </Text>
      <ChevronDown color={iconColor} />
    </div>
  );
};

const PaymentSelectorScreen = ({
  onClose,
  updatePayment,
  payments,
}: {
  onClose: () => void;
  updatePayment: (payment: any) => void;
  payments: any[];
}) => {
  return (
    <SelectorWrapper>
      <Flex direction="column" gap={8}>
        {payments?.map((payment, index) => {
          if (payment.isActive) {
            const isWireTransfer = payment.id === "pm_us_wire_bank_transfer";
            const isCashApp = payment.id === "pm_cash_app";
            return (
              <ListItem
                key={index}
                small
                title={paymentMethods(payment)}
                subtitle={`processing time ${payment.processingTime}`}
                img={!isWireTransfer && !isCashApp && payment.icon}
                onClick={() => {
                  updatePayment(payment);
                  onClose();
                }}>
                {isWireTransfer && <ListItemIcon as={Bank} />}
                {isCashApp && <ListItemIcon as={BankNote01} />}
              </ListItem>
            );
          }
          return null;
        })}
      </Flex>
    </SelectorWrapper>
  );
};

const CurrencySelectorScreen = ({
  onClose,
  currencies,
  updateCurrency,
}: {
  onClose: () => void;
  currencies: any[];
  updateCurrency: (currency: any) => void;
}) => {
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
    <SelectorWrapper>
      <div style={{ paddingBottom: "18px" }}>
        <Input placeholder="Search currency" fullWidth variant="search" sizeVariant="small" {...searchInput.bindings} />
      </div>
      <Flex direction="column" gap={8}>
        {filteredCurrencies.map((currency, index) => {
          return (
            <ListItem
              key={index}
              squircleSize={40}
              title={currency.symbol}
              subtitle={currency.name}
              hideSquircle
              icon={<TokenLogo src={currency.logo} style={{ height: 40, width: 40 }} backgroundColor="transparent" />}
              onClick={() => {
                updateCurrency(currency);
                onClose();
              }}
            />
          );
        })}
      </Flex>
    </SelectorWrapper>
  );
};

const Label = styled.div<{ outer?: boolean }>`
  margin: ${(props) => props.style?.margin || "0"};
  padding-top: ${(props) => props.style?.paddingTop || "0px"};
  padding-bottom: ${(props) => props.style?.paddingBottom || "8px"};
  font-size: ${(props) => props.style?.fontSize || "16px"};
  color: ${(props) => (props.outer ? props.theme.primaryText : props.theme.secondaryText)};
`;

const Wrapper = styled(Section).attrs({ showPaddingVertical: false })`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  justify-content: space-between;
`;

const Top = styled.div``;

const SelectorWrapper = styled.div`
  width: 100%;
`;

const Switch = styled.button`
  padding: 16px 0;
  display: flex;
  gap: 10px;
  border: none;
  background: none;
  outline: none;
  box-shadow: none;
  cursor: pointer;
  margin: auto;
`;
export const Line = styled.div<{ margin?: string }>`
  margin: ${(props) => (props.margin ? props.margin : "18px")} 0;
  height: 1px;
  width: 100%;
  background-color: ${(props) => props.theme.borderDefault};
`;

export const TokenLogo = styled(CommonImage).attrs((props) => ({
  alt: "token-logo",
  draggable: false,
  backgroundColor: props.backgroundColor || "#fffefc",
}))<{ backgroundColor?: string }>`
  height: 24px;
  width: 24px;
  border-radius: 50%;
  display: block;
  vertical-align: middle;
`;

const WarningWrapper = styled.div`
  display: flex;
  justify-content: center;
  text-align: center;
  align-items: center;
  flex-direction: row;
  margin-bottom: 10px;
`;

const WarningContent = styled.span`
  font-size: 16px;
  border: 1px solid ${(props) => props.theme.surfaceTertiary};
  border-radius: 30px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${(props) => props.theme.primaryTextv2};
`;
