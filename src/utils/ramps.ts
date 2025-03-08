import type { PaymentType } from "~lib/onramper";

// https://transak.notion.site/On-Ramp-Payment-Methods-Fees-Other-Details-b0761634feed4b338a69f4f186d906a5
export const paymentMethods = (paymentMethod: PaymentType) => {
  const customPaymentMethodNames = {
    // "sepa_bank_transfer": "",
    // "gbp_bank_transfer": "",
    // "pm_open_banking": "",
    credit_debit_card: "Credit or Debit Card",
    // "apple_pay": "",
    // "google_pay": "",
    // "pm_paymaya": "",
    // "pm_bpi": "",
    pm_cash_app: "Cash App",
    // "pm_grabpay": "",
    // "pm_shopeepay": "",
    // "pm_gcash": "",
    // "pm_astropay": "",
    // "inr_bank_transfer": "",
    // "inr_upi": "",
    "pm_us_wire_bank_transfer ": "Wire Transfer"
  };

  if (customPaymentMethodNames.hasOwnProperty(paymentMethod?.id)) {
    return customPaymentMethodNames[paymentMethod.id];
  }

  return paymentMethod?.name ?? "";
};
