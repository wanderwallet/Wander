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
