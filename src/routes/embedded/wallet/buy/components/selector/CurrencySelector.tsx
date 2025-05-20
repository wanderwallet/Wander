import { useMemo } from "react";
import React from "react";
import { Coins03 } from "@untitled-ui/icons-react";
import { useInput } from "@arconnect/components-rebrand";
import SelectorContainer from "./SelectorContainer";
import SelectorItem from "./SelectorItem";
import { TextInput } from "~components/embed";

interface CurrencySelectorProps {
  currencies: any[];
  selectedCurrency: any;
  handleUpdateCurrency: (currency: any, e?: React.MouseEvent) => void;
  onClose: (e?: React.MouseEvent) => void;
}

export const CurrencySelector = ({
  currencies,
  selectedCurrency,
  handleUpdateCurrency,
  onClose,
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
      <TextInput
        name="currencySearch"
        placeholder="Search currency"
        {...searchInput.bindings}
        style={{
          // position: "sticky",
          // top: 0,
        }}
      />

      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-3)",
          width: "100%",
          padding: 0,
          margin: 0,
          listStyle: "none",
        }}>
        {filteredCurrencies.map((currency) => {
          const currencyIcon = currency.logo ? (
            <img
              src={currency.logo}
              alt={currency.name}
              style={{
                width: "1em",
                height: "1em",
                objectFit: "contain",
                borderRadius: "128px",
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
      </ul>
    </SelectorContainer>
  );
};
