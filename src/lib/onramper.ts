import browser from "webextension-polyfill";

export type PaymentType = {
  name: string;
  id: string;
  isNftAllowed: boolean;
  isNonCustodial: boolean;
  processingTime: string;
  displayText: boolean;
  icon: string;
  limitCurrency: string;
  isActive: boolean;
  provider: string;
  maxAmount: number;
  minAmount: number;
  defaultAmount: number;
  isConverted: boolean;
  visaPayoutCountries: string[];
  mastercardPayoutCountries: string[];
  isPayOutAllowed: boolean;
  minAmountForPayOut: number;
  maxAmountForPayOut: number;
  defaultAmountForPayOut: number;
};

export type Quote = {
  quoteId: string;
  conversionPrice: number;
  marketConversionPrice: number;
  slippage: number;
  fiatCurrency: string;
  cryptoCurrency: string;
  paymentMethod: string;
  fiatAmount: number;
  cryptoAmount: number;
  isBuyOrSell: "BUY" | "SELL";
  network: string;
  feeDecimal: number;
  totalFee: number;
  feeBreakdown: Array<{
    name: string;
    value: number;
    id: string;
    ids: Array<string>;
  }>;
  nonce: number;
  cryptoLiquidityProvider: string;
  notes: Array<string>;
};

/**
 * GET currency $AR price quote
 *
 * @param currency Symbol of the currency to get the quote for
 * @param paymentMethod How the user plans to pay for AR
 * @param amount How much fiat currency to buy AR with
 */
export async function getQuote(currency: string, paymentMethod: string, amount: number) {
  try {
    const apiKey = process.env.PLASMO_PUBLIC_ONRAMPER_API_KEY;

    if (!apiKey) {
      throw new Error("API key is undefined");
    }

    const response = await fetch(
      `https://api.onramper.com/quotes/${currency}/ar_arweave?paymentMethod=${paymentMethod}&amount=${amount}`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const payout = data.length > 0 ? data[0].payout : undefined;

    if (payout === undefined && data[1].ramp === "transak") {
      console.log(data[1].errors[0].message);
      throw new Error(data[1].errors[0].message);
    } else if (payout === "undefined") {
      throw new Error(browser.i18n.getMessage("conversion_error"));
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * POST Buy AR transaction for checkout
 *
 * @param onramp onramp being used
 * @param source fiat currency chosen
 * @param destination <-- ar_arweave
 * @param amount amount of fiat buying AR with
 * @param type <-- buy
 * @param paymentMethod chosen payment method
 * @param wallet.address user's active wallet address
 * @param network <-- arweave
 */

export async function buyRequest(
  onramp: string,
  source: string,
  amount: number,
  paymentMethod: string,
  wallet: { address: string },
) {
  try {
    const apiKey = process.env.PLASMO_PUBLIC_ONRAMPER_API_KEY;

    if (!apiKey) {
      throw new Error("API key is undefined");
    }

    const url = "https://api.onramper.com/checkout/intent";

    const requestBody = {
      onramp,
      source,
      destination: "ar_arweave",
      amount,
      type: "buy",
      paymentMethod,
      wallet: {
        address: wallet.address,
      },
      network: "arweave",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending POST request: ", error);
    throw error;
  }
}

/**
 * GET Supported Payment Types for specific fiat currency
 *
 * @param currency symbol of currency to get payment types for
 */

export async function getPaymentTypes(currency: string) {
  try {
    const apiKey = process.env.PLASMO_PUBLIC_ONRAMPER_API_KEY;

    if (!apiKey) {
      throw new Error("API key is undefined");
    }

    const response = await fetch(`https://api.onramper.com/supported/payment-types/transak/${currency}/ar_arweave`, {
      headers: {
        Authorization: apiKey,
      },
    });
    console.log("response", response, currency);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return data.message;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
