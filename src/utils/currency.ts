import { ExtensionStorage } from "./storage";

interface ExchangeRateResponse {
  result: string;
  base_code: string;
  rates: Record<string, number>;
  time_next_update_unix: number;
}

interface CacheData {
  rates: Record<string, number>;
  expiry: number;
}

const CACHE_KEY = "exchange_rates_cache";

const RATES = {
  USD: 1,
  AED: 3.6725,
  ARS: 1029,
  AUD: 1.606327,
  BDT: 119.471102,
  BHD: 0.376,
  BMD: 1,
  BRL: 6.181083,
  CAD: 1.440475,
  CHF: 0.899005,
  CLP: 990.02948,
  CNY: 7.302858,
  CZK: 24.152261,
  DKK: 7.16015,
  EUR: 0.960034,
  GBP: 0.798247,
  HKD: 7.768346,
  HUF: 394.22656,
  IDR: 16212.368068,
  ILS: 3.659663,
  INR: 85.367884,
  JPY: 157.662259,
  KRW: 1465.387336,
  KWD: 0.308155,
  LKR: 293.75877,
  MMK: 2097.410301,
  MXN: 20.217459,
  MYR: 4.470168,
  NGN: 1539.042697,
  NOK: 11.390423,
  NZD: 1.776574,
  PHP: 58.177211,
  PKR: 278.127607,
  PLN: 4.095483,
  RUB: 99.830651,
  SAR: 3.75,
  SEK: 11.055387,
  SGD: 1.359069,
  THB: 34.151724,
  TRY: 35.243496,
  TWD: 32.733051,
  UAH: 41.834357,
  VND: 25446.896969,
  ZAR: 18.820624
};

async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const now = Date.now();
    const cache = await ExtensionStorage.get<CacheData | null>(CACHE_KEY);

    // Validate cache structure and return if valid
    if (
      cache &&
      typeof cache.expiry === "number" &&
      cache.rates &&
      typeof cache.rates === "object" &&
      now < cache.expiry
    ) {
      return cache.rates;
    }

    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: ExchangeRateResponse = await response.json();

    // Validate API response
    if (
      !data.rates ||
      typeof data.rates !== "object" ||
      !data.time_next_update_unix
    ) {
      throw new Error("Invalid API response format");
    }

    const rates = Object.fromEntries(
      Object.entries(data.rates).filter(([currency, _]) =>
        currencies.includes(currency)
      )
    );

    // Cache the new rates
    const newCache: CacheData = {
      rates,
      expiry: data.time_next_update_unix * 1000
    };

    try {
      await ExtensionStorage.set(CACHE_KEY, newCache);
    } catch (storageError) {
      console.warn("Failed to cache exchange rates:", storageError);
    }

    return data.rates;
  } catch (error) {
    console.error("Error fetching exchange rates:", error);

    // Try to use cached rates as fallback, even if expired
    try {
      const cache = await ExtensionStorage.get<CacheData | null>(CACHE_KEY);
      if (cache) {
        if (cache?.rates && typeof cache.rates === "object") {
          return cache.rates;
        }
      }
    } catch (fallbackError) {
      console.warn("Failed to use cached rates as fallback:", fallbackError);
    }

    // Use hardcoded rates as last resort
    return RATES;
  }
}

export async function convertUSDTo(
  amount: number,
  targetCurrency: string
): Promise<number> {
  const rates = await getExchangeRates();
  const rate = rates[targetCurrency.toUpperCase()];

  if (!rate) {
    throw new Error(`Currency ${targetCurrency} not found`);
  }

  return amount * rate;
}

export async function getConversionRate(
  targetCurrency: string
): Promise<number> {
  if (targetCurrency === "USD") return 1;
  const rates = await getExchangeRates();
  return rates[targetCurrency.toUpperCase()];
}

export const currencies = [
  "USD",
  "EUR",
  "GBP",
  "CNY",
  "INR",
  "AED",
  "ARS",
  "AUD",
  "BDT",
  "BHD",
  "BMD",
  "BRL",
  "CAD",
  "CHF",
  "CLP",
  "CZK",
  "DKK",
  "HKD",
  "HUF",
  "IDR",
  "ILS",
  "JPY",
  "KRW",
  "KWD",
  "LKR",
  "MMK",
  "MXN",
  "MYR",
  "NGN",
  "NOK",
  "NZD",
  "PHP",
  "PKR",
  "PLN",
  "RUB",
  "SAR",
  "SEK",
  "SGD",
  "THB",
  "TRY",
  "TWD",
  "UAH",
  "VEF",
  "VND",
  "ZAR"
];
