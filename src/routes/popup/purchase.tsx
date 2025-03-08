import {
  Text,
  Input,
  useInput,
  useToasts,
  Section,
  Button,
  Loading,
  ListItem,
  ListItemIcon
} from "@arconnect/components-rebrand";
import browser from "webextension-polyfill";
import {
  Bank,
  BankNote01,
  ChevronDown,
  SwitchVertical02
} from "@untitled-ui/icons-react";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageType, trackPage } from "~utils/analytics";
import type { PaymentType, Quote } from "~lib/onramper";
import { useLocation } from "~wallets/router/router.utils";
import { ExtensionStorage } from "~utils/storage";
import { useDebounce } from "~wallets/hooks";
import { retryWithDelay } from "~utils/promises/retry";
import SliderMenu from "~components/SliderMenu";
import { paymentMethods } from "~utils/ramps";
import { useTheme } from "styled-components";
import arLogo from "url:/assets/ecosystem/ar-logo.svg";
import CommonImage from "~components/common/Image";
import getSymbolFromCurrency from "currency-symbol-map";
import { useStorage } from "@plasmohq/storage/hook";
import { WarningIcon } from "~components/popup/Token";
import { Flex } from "~components/common/Flex";

const BASE_URL = "https://api.transak.com";

export function PurchaseView() {
  const { navigate } = useLocation();

  const youPayInput = useInput();
  const debouncedYouPayInput = useDebounce(youPayInput.state, 300);
  const [arConversion, setArConversion] = useState<boolean>(false);
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
  const { setToast } = useToasts();
  const theme = useTheme();

  const [activeAddress] = useStorage<string>({
    key: "active_address",
    instance: ExtensionStorage
  });

  const handlePaymentClose = () => {
    setShowPaymentSelector(false);
  };

  const handleCurrencyClose = () => {
    setShowCurrencySelector(false);
  };

  const showTransakErrorToast = () => {
    setToast({
      type: "error",
      content: browser.i18n.getMessage("transak_unavailable"),
      duration: 2400
    });
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

  const handleUpdateCurrency = useCallback((currency: any) => {
    if (currency) {
      setSelectedCurrency(currency);
    }

    const activePaymentOptions = (currency?.paymentOptions ?? []).filter(
      (payment: any) => payment.isActive
    );
    setPaymentMethod(activePaymentOptions[0] || null);
  }, []);

  //segment
  useEffect(() => {
    trackPage(PageType.TRANSAK_PURCHASE);
  }, []);

  useEffect(() => {
    const fetchCurrencies = async () => {
      const url = `${BASE_URL}/api/v2/currencies/fiat-currencies?apiKey=${process.env.PLASMO_PUBLIC_TRANSAK_API_KEY}`;
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
        Number(debouncedYouPayInput) <= 0 ||
        debouncedYouPayInput === "" ||
        !selectedCurrency ||
        !paymentMethod
      ) {
        finishUp(null);
        return;
      }
      if (
        !arConversion &&
        (+debouncedYouPayInput > paymentMethod.maxAmount ||
          +debouncedYouPayInput < paymentMethod.minAmount)
      ) {
        const isExceedMaxAmount =
          +debouncedYouPayInput > paymentMethod.maxAmount;
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
        partnerApiKey: process.env.PLASMO_PUBLIC_TRANSAK_API_KEY,
        fiatCurrency: selectedCurrency?.symbol,
        cryptoCurrency: "AR",
        isBuyOrSell: "BUY",
        network: "mainnet",
        paymentMethod: paymentMethod.id
      });
      if (arConversion) {
        params.append("cryptoAmount", debouncedYouPayInput);
      } else {
        params.append("fiatAmount", debouncedYouPayInput);
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
              // TODO: decide whether to notify errors by toast or warning styled component
              // to make it consistent with mobile app
              // setToast({
              //   type: "error",
              //   content: resJson?.error?.message,
              //   duration: 2400
              // });
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

    if (debouncedYouPayInput) {
      fetchQuote();
    } else {
      setQuote(null);
      setExchangeRate(0);
      setUnavailableQuote(false);
    }
  }, [debouncedYouPayInput, selectedCurrency, paymentMethod, arConversion]);

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
        apiKey: process.env.PLASMO_PUBLIC_TRANSAK_API_KEY,
        defaultCryptoCurrency: "AR",
        defaultFiatAmount: quote.fiatAmount.toString(),
        defaultFiatCurrency: quote.fiatCurrency,
        walletAddress: activeAddress,
        defaultPaymentMethod: quote.paymentMethod
      });
      const url = `${baseUrl}?${params.toString()}`;
      browser.tabs.create({
        url: url
      });
      navigate("/purchase-pending");
    } catch (error) {
      console.error("Error buying AR:", error);
    }
  };

  const handleInputChange = (event: React.FormEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    input.value = input.value.replace(/[^0-9.]/g, "");
  };

  return (
    <>
      <HeadV2 title="Buy" />
      <Wrapper>
        <Top>
          {(unavailableQuote || invalidFiatAmount) && (
            <WarningWrapper>
              <WarningContent>
                <WarningIcon /> {error}
              </WarningContent>
            </WarningWrapper>
          )}
          <Input
            stacked
            sizeVariant="large"
            onInput={handleInputChange}
            inputMode="numeric"
            placeholder={
              arConversion
                ? "0"
                : `${getSymbolFromCurrency(selectedCurrency?.symbol) || ""}0`
            }
            {...youPayInput.bindings}
            fullWidth
            hasRightIcon
            iconLeft={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  marginRight: "10px",
                  cursor: "default"
                }}
              >
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
                    onClick={() => setShowCurrencySelector(true)}
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
                : theme.input.placeholder.search
            }}
            inputStyle={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}
          />
          <Switch
            onClick={() => {
              if (quote) {
                if (arConversion) {
                  youPayInput.setState(quote.fiatAmount.toString());
                } else {
                  youPayInput.setState(quote.cryptoAmount.toString());
                }
              }
              setArConversion(!arConversion);
            }}
          >
            <SwitchVertical02 height={20} color={theme.primaryText} />
          </Switch>
          <InputButton
            style={{
              background: theme.surfaceTertiary,
              height: "90px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between"
            }}
            innerStyle={{
              fontSize: "40px",
              color: arConversion
                ? quote?.fiatAmount.toString()
                  ? theme.primaryTextv2
                  : theme.input.placeholder.search
                : quote?.cryptoAmount.toString()
                ? theme.primaryTextv2
                : theme.input.placeholder.search
            }}
            disabled={!arConversion}
            label={
              arConversion
                ? browser.i18n.getMessage("buy_screen_pay")
                : browser.i18n.getMessage("buy_screen_receive")
            }
            // label={arConversion ? "You Pay" : "You Receive"}
            onClick={() => setShowCurrencySelector(true)}
            body={
              loading ? (
                <Loading />
              ) : arConversion ? (
                `${getSymbolFromCurrency(selectedCurrency?.symbol) || ""}${
                  quote?.fiatAmount.toFixed(2) ?? "0"
                }`
              ) : (
                quote?.cryptoAmount.toString() ?? "0"
              )
            }
            icon={
              !arConversion ? (
                <AR />
              ) : (
                <Tag
                  currency={selectedCurrency?.symbol || ""}
                  currencyLogo={selectedCurrency?.logo || ""}
                  onClick={() => setShowCurrencySelector(true)}
                  iconColor={theme.secondaryText}
                />
              )
            }
          />
          {exchangeRate && youPayInput.bindings.value ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%"
              }}
            >
              <Label
                style={{
                  paddingTop: "14px",
                  paddingBottom: "0px",
                  fontSize: "14px"
                }}
              >
                {browser.i18n.getMessage("exchange_message")}
              </Label>
              <Label
                style={{
                  paddingTop: "14px",
                  paddingBottom: "0px",
                  fontSize: "14px",
                  margin: "right"
                }}
                outer
              >
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
            onClick={() => setShowPaymentSelector(true)}
            disabled={!paymentMethod}
            body={paymentMethods(paymentMethod)}
            icon={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <ChevronDown onClick={() => setShowPaymentSelector(true)} />
              </div>
            }
            outerLabel
          />

          <SliderMenu
            title={browser.i18n.getMessage("currency")}
            isOpen={showCurrencySelector}
            onClose={() => {
              setShowCurrencySelector(false);
            }}
          >
            <CurrencySelectorScreen
              onClose={handleCurrencyClose}
              updateCurrency={handleUpdateCurrency}
              currencies={currencies}
            />
          </SliderMenu>

          <SliderMenu
            title={browser.i18n.getMessage("buy_screen_payment_method")}
            isOpen={showPaymentSelector}
            onClose={() => {
              setShowPaymentSelector(false);
            }}
          >
            <PaymentSelectorScreen
              payments={selectedCurrency?.paymentOptions}
              updatePayment={setPaymentMethod}
              onClose={handlePaymentClose}
            />
          </SliderMenu>
        </Top>
        <Button
          disabled={!quote || invalidFiatAmount}
          fullWidth
          onClick={async () => {
            await ExtensionStorage.set("transak_quote", quote);
            await buyAR();
          }}
        >
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
        gap: "4px"
      }}
    >
      <TokenLogo src={arLogo} />
      <Text noMargin>AR</Text>
    </div>
  );
};

const Tag = ({
  currency,
  currencyLogo,
  iconColor,
  onClick
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
        gap: "8px"
      }}
      onClick={onClick}
    >
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
  payments
}: {
  onClose: () => void;
  updatePayment: (payment: any) => void;
  payments: any[];
}) => {
  return (
    <SelectorWrapper>
      <Flex direction="column" gap={8}>
        {payments.map((payment, index) => {
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
                }}
              >
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
  updateCurrency,
  currencies
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
        <Input
          placeholder="Search currency"
          fullWidth
          variant="search"
          sizeVariant="small"
          {...searchInput.bindings}
        />
      </div>
      <Flex direction="column" gap={8}>
        {filteredCurrencies.map((currency, index) => {
          return (
            <ListItem
              key={index}
              squircleSize={40}
              title={currency.symbol}
              subtitle={currency.name}
              img={currency.logo}
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

const InputButton = ({
  label,
  body,
  icon,
  onClick,
  disabled,
  style,
  innerStyle,
  outerLabel
}: {
  label: string;
  body: string | React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  style?: React.CSSProperties;
  innerStyle?: React.CSSProperties;
  outerLabel?: boolean;
}) => {
  return (
    <div>
      {outerLabel && <Label outer={outerLabel}>{label}</Label>}
      <InputButtonWrapper onClick={onClick} disabled={disabled} style={style}>
        {!outerLabel && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              textAlign: "left",
              gap: "4px"
            }}
          >
            <Text size="sm" noMargin weight="medium" variant="secondary">
              {label}
            </Text>
            <div style={innerStyle}>{body}</div>
          </div>
        )}
        {outerLabel && <div style={innerStyle}>{body}</div>}
        {icon}
      </InputButtonWrapper>
    </div>
  );
};

const InputButtonWrapper = styled.button`
  background: ${(props) => props.style?.background ?? "none"};
  color: ${(props) => props.theme.primaryTextv2};
  font-size: ${(props) => props.style?.fontSize ?? "16px"};
  display: flex;
  height: ${(props) => props.style?.height ?? "42px"};
  padding: 12px;
  border-radius: 10px;
  width: 100%;
  justify-content: space-between;
  cursor: ${(props) => (props.disabled ? "default" : "pointer")};

  &:hover {
    border-color: ${(props) => !props.disabled && props.theme.primaryTextv2};
  }
`;

const Label = styled.div<{ outer?: boolean }>`
  margin: ${(props) => props.style?.margin || "0"};
  padding-top: ${(props) => props.style?.paddingTop || "0px"};
  padding-bottom: ${(props) => props.style?.paddingBottom || "8px"};
  font-size: ${(props) => props.style?.fontSize || "16px"};
  color: ${(props) =>
    props.outer ? props.theme.primaryText : props.theme.secondaryText};
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

export const TokenLogo = styled(CommonImage).attrs({
  alt: "token-logo",
  draggable: false,
  backgroundColor: "#fffefc"
})`
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
