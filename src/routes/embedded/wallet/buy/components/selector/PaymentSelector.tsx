import React from "react";
import { Bank, BankNote01, CreditCard01 } from "@untitled-ui/icons-react";
import { paymentMethods } from "~utils/ramps";
import SelectorContainer from "./SelectorContainer";
import SelectorItem from "./SelectorItem";

interface PaymentSelectorProps {
  selectedCurrency: any;
  paymentMethod: any;
  setPaymentMethod: (payment: any) => void;
  onClose: (e?: React.MouseEvent) => void;
}

export const PaymentSelector = ({
  selectedCurrency,
  paymentMethod,
  setPaymentMethod,
  onClose,
}: PaymentSelectorProps) => {
  return (
    <SelectorContainer title="Select Payment Method" onClose={onClose}>
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
                    width: "1.5em",
                    height: "1.5em",
                    objectFit: "contain",
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
                subtitle={`Processing time ${payment.processingTime || "standard"}`}
                isSelected={payment.id === paymentMethod?.id}
                onClick={(e) => {
                  e.preventDefault();
                  setPaymentMethod(payment);
                  onClose(e);
                }}
              />
            );
          })}
      </ul>
    </SelectorContainer>
  );
};
