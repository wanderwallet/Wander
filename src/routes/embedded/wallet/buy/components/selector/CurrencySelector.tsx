import { useMemo } from "react";
import { Input } from "~components/embed/ui";
import React from "react";
import { Coins03 } from "@untitled-ui/icons-react";
import { useInput } from "@arconnect/components-rebrand";
import SelectorContainer from "./SelectorContainer";
import SelectorItem from "./SelectorItem";

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
      <div style={{ marginBottom: "16px", width: "100%" }}>
        <Input
          placeholder="Search currency"
          {...searchInput.bindings}
          isFullWidth
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--color-border-default)",
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
          maxHeight: "calc(100% - 60px)",
        }}>
        {filteredCurrencies.map((currency) => {
          const currencyIcon = currency.logo ? (
            <img
              src={currency.logo}
              alt={currency.name}
              style={{
                width: "24px",
                height: "24px",
                objectFit: "contain",
                borderRadius: "50%",
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
