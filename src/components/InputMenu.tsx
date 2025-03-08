import { useState, useEffect } from "react";
import browser, { search } from "webextension-polyfill";
import styled from "styled-components";
import { useTheme, hoverEffect } from "~utils/theme";
import type { DisplayTheme } from "@arconnect/components-rebrand";
import { CloseIcon, ChevronDownIcon, SearchIcon } from "@iconicicons/react";
import amex from "url:/assets/ecosystem/amex.svg";
import mastercard from "url:/assets/ecosystem/mastercard.svg";
import visa from "url:/assets/ecosystem/visa.svg";
import supportedCurrencies from "~utils/supported_currencies";
import { getPaymentTypes } from "~lib/onramper";

interface InputMenuProps {
  onPaymentMethodChange?: (methodId: string) => void;
  onFiatCurrencyChange?: (currency: string) => void;
  isPaymentMethod: boolean;
  selectedPaymentMethod?: string;
  selectedFiatCurrency?: string;
}

export default function InputMenu({
  onPaymentMethodChange,
  onFiatCurrencyChange,
  isPaymentMethod,
  selectedPaymentMethod,
  selectedFiatCurrency
}: InputMenuProps) {
  const theme = useTheme();

  const [searchInput, setSearchInput] = useState("");
  const [chooseOption, setChooseOption] = useState(false);
  const [supportedPayments, setSupportedPayments] = useState([]);

  const defaultPaymentMethod = {
    id: "creditcard",
    logo: "https://cdn.onramper.com/icons/payments/creditcard.svg",
    text: "Credit Card"
  };

  const [chosenOption, setChosenOption] = useState(defaultPaymentMethod);

  useEffect(() => {
    if (isPaymentMethod && onPaymentMethodChange) {
      const selectedMethod = options.find(
        (option) => option.id === selectedPaymentMethod
      );
      if (selectedMethod) {
        setChosenOption(selectedMethod);
      }
    }
  }, [onPaymentMethodChange, isPaymentMethod, selectedPaymentMethod]);

  useEffect(() => {
    if (!isPaymentMethod) {
      const activeCurrency =
        supportedCurrencies.find(
          (currency) => currency.id === selectedFiatCurrency
        ) || supportedCurrencies[13];
      setChosenOption({
        id: activeCurrency.id,
        logo: `https://cdn.onramper.com/icons/tokens/${activeCurrency.id}.svg`,
        text: activeCurrency.name
      });
      setChooseOption(true);
    }
  }, [isPaymentMethod, selectedFiatCurrency]);

  useEffect(() => {
    async function getPayments() {
      const payments = await getPaymentTypes(selectedFiatCurrency);

      const isCurrentPaymentSupported = payments.some(
        (payment) => payment.paymentTypeId === chosenOption.id
      );

      if (!isCurrentPaymentSupported && isPaymentMethod) {
        setChosenOption(defaultPaymentMethod);
      }

      setSupportedPayments(payments);
    }
    getPayments();
  }, [selectedFiatCurrency, onFiatCurrencyChange, isPaymentMethod]);

  const options = isPaymentMethod
    ? supportedPayments.map((paymentType) => ({
        id: paymentType.paymentTypeId,
        logo: paymentType.icon,
        text: paymentType.name
      }))
    : supportedCurrencies.map((currency) => ({
        id: currency.id,
        logo: `https://cdn.onramper.com/icons/tokens/${currency.id}.svg`,
        text: currency.name
      }));

  const OptionSelect = () => (
    <SelectInput displayTheme={theme} onClick={() => setChooseOption(true)}>
      <OptionWrapper>
        <OptionIcon
          src={chosenOption.logo}
          alt={chosenOption.text}
          draggable={false}
        />
        {chosenOption.text}
      </OptionWrapper>
      <SelectIcon displayTheme={theme} />
    </SelectInput>
  );

  const filteredOptions = options.filter(
    (option) =>
      option.id.toLowerCase().includes(searchInput.toLowerCase()) ||
      option.text.toLowerCase().includes(searchInput.toLowerCase())
  );

  const OptionModal = () => (
    <Wrapper displayTheme={theme}>
      <Content displayTheme={theme}>
        <Header>
          <Title>
            {isPaymentMethod
              ? browser.i18n.getMessage("choose_payment_method")
              : browser.i18n.getMessage("choose_fiat_currency")}
          </Title>
          <BackWrapper>
            <ExitIcon
              onClick={() => {
                if (isPaymentMethod) {
                  setChooseOption(false);
                } else {
                  onFiatCurrencyChange(chosenOption.id);
                }
              }}
            />
          </BackWrapper>
        </Header>
        {!isPaymentMethod && (
          <SearchWrapper displayTheme={theme}>
            <InputSearchIcon />
            <SearchInput
              displayTheme={theme}
              placeholder={browser.i18n.getMessage(
                "search_currency_placeholder"
              )}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </SearchWrapper>
        )}
        <OptionsContainer>
          {!searchInput &&
            options.map((option) => (
              <Option
                key={option.id}
                displayTheme={theme}
                active={chosenOption.id === option.id}
                onClick={() => {
                  setChosenOption(option);
                  setChooseOption(false);
                  if (isPaymentMethod) {
                    onPaymentMethodChange(option.id);
                  } else {
                    onFiatCurrencyChange(option.id);
                  }
                }}
              >
                <OptionIcon
                  src={option.logo}
                  alt={option.text}
                  draggable={false}
                />
                {isPaymentMethod && option.text}
                {!isPaymentMethod && (
                  <OptionText>
                    {option.id.toLocaleUpperCase()}
                    <CurrencyName>{option.text}</CurrencyName>
                  </OptionText>
                )}
                {isPaymentMethod && option.id === "creditcard" && (
                  <>
                    <CreditIcon src={visa} alt="visa" />
                    <CreditIcon src={mastercard} alt="mastercard" />
                    <CreditIcon src={amex} alt="american express" />
                  </>
                )}
              </Option>
            ))}
          {searchInput &&
            filteredOptions.map((option) => (
              <Option
                key={option.id}
                displayTheme={theme}
                active={chosenOption.id === option.id}
                onClick={() => {
                  setChosenOption(option);
                  setChooseOption(false);
                  onFiatCurrencyChange(option.id);
                }}
              >
                <OptionIcon
                  src={option.logo}
                  alt={option.text}
                  draggable={false}
                />
                <OptionText>
                  {option.id.toLocaleUpperCase()}
                  <CurrencyName>{option.text}</CurrencyName>
                </OptionText>
              </Option>
            ))}
        </OptionsContainer>
      </Content>
    </Wrapper>
  );

  return <>{!chooseOption ? OptionSelect() : OptionModal()}</>;
}

const SearchInput = styled.input<{ displayTheme: DisplayTheme }>`
  width: 100%;
  background-color: transparent;
  color: ${(props) =>
    props.displayTheme === "light" ? "#AB9AFF" : "#ffffffb2"};
  padding: 10px 10px 10px 3px;
  outline: none;
  border: none;
  font-size: 1.2rem;
  font-size: 16px;

  &::placeholder {
    color: ${(props) =>
      props.displayTheme === "light" ? "#AB9AFF" : "#ffffffb2"};
    font-size: 16px;
    /* Add any other placeholder styles you need */
  }

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  appearance: textfield;
`;

const SearchWrapper = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 37px;
  background-color: #ab9aff26;
  padding: 10px 5px;
  border: ${(props) =>
    props.displayTheme === "light"
      ? "1.5px solid #AB9AFF"
      : "1.5px solid #ab9aff26"};
  border-radius: 15px;
  margin: 3px 15px 3px 12px;
`;

const InputSearchIcon = styled(SearchIcon)`
  color: #ab9aff;
  width: 40px;
  height: 40px;
  padding: 2px 7px 2px 0px;
`;

const CurrencyName = styled.div`
  color: #aeadcd;
  font-size: 11px;
`;

const OptionText = styled.div`
  display: flex;
  flex-direction: column;
`;

const OptionsContainer = styled.div`
  margin-top: 10px;
`;

const Option = styled.div<{ active: boolean; displayTheme: DisplayTheme }>`
  height: 53px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-radius: 15px;
  padding: 1px 7px 1px 7px;
  gap: 10px;
  cursor: pointer;
  font-size: 15px;
  margin: 3px 15px 3px 12px;

  background-color: rgba(
    ${(props) => props.theme.theme},
    ${(props) =>
      props.active ? (props.theme.displayTheme === "light" ? ".2" : ".1") : "0"}
  );
  transition: all 0.23s ease-in-out;

  &:hover {
    background-color: rgba(
      ${(props) =>
        props.theme.theme +
        ", " +
        (props.active
          ? props.theme.displayTheme === "light"
            ? ".24"
            : ".14"
          : props.theme.displayTheme === "light"
          ? ".14"
          : ".04")}
    );
  }
`;

const SelectIcon = styled(ChevronDownIcon)<{ displayTheme: DisplayTheme }>`
  width: 37px;
  height: 37px;
  color: ${(props) => (props.displayTheme === "light" ? "#000000" : "#ffffff")};
`;

const SelectInput = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: #ab9aff26;
  padding: 10px;
  border: ${(props) =>
    props.displayTheme === "light"
      ? "1px solid #AB9AFF"
      : "1px solid #ab9aff26"};
  border-radius: 12px;
  margin-bottom: 10px;
  font-size: 15px;
  font-weight: 500;
  padding: 12.91px 5px 12.91px 12.91px;
  cursor: pointer;
`;

const OptionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
`;

const CreditIcon = styled.img`
  width: 27px;
  height: 19px;
`;

const OptionIcon = styled.img`
  width: 37px;
  height: 37px;
  background-color: transparent;
`;

const Header = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 23.6px 12px 12.4px 12px;
`;

const Title = styled.div`
  color: #ab9aff;
  display: inline-block;
  font-size: 21px;
  font-weight: 500;
`;

const BackWrapper = styled.div`
  position: relative;
  display: flex;
  width: max-content;
  height: max-content;
  cursor: pointer;

  ${hoverEffect}

  &::after {
    width: 158%;
    height: 158%;
    border-radius: 100%;
  }

  &:active svg {
    transform: scale(0.92);
  }
`;

const ExitIcon = styled(CloseIcon)`
  color: #ab9aff;
  height: 30px;
  width: 30px;
`;

const Content = styled.div<{ displayTheme: DisplayTheme }>`
  display: flex;
  flex-direction: column;
  border-top: 1.29px solid #ab9aff;
  width: 100%;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "#191919"};
`;

const Wrapper = styled.div<{ displayTheme: DisplayTheme }>`
  position: fixed;
  display: flex;
  flex-direction: column;
  height: 100vh;
  z-index: 50000;
  width: 100%;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 100%;
  padding-top: 40px;
  background-color: ${(props) =>
    props.displayTheme === "light" ? "#ffffff" : "#191919"};
`;
