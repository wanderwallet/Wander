import axios from "axios";
import { TempTransactionStorage } from "./storage";

type Source = {
  url: string;
  extract: (data: any) => string | undefined;
};

const sources: Source[] = [
  {
    url: "https://1.0.0.1/cdn-cgi/trace",
    extract: (data) => (typeof data === "string" ? data.match(/loc=([A-Z]+)/)?.[1]?.trim() : undefined),
  },
  {
    url: "https://ipapi.co/json/",
    extract: (data) => data?.country_code,
  },
  {
    url: "https://ipinfo.io/json",
    extract: (data) => data?.country,
  },
];

const REQUEST_TIMEOUT = 3000;

/**
 * Get user's country code
 * Tries multiple providers with fallback
 */
export const getUserCountryCode = async (): Promise<string | undefined> => {
  try {
    const cachedCountry = await TempTransactionStorage.get<string>("user_country");
    if (cachedCountry) return cachedCountry;

    for (const { url, extract } of sources) {
      try {
        const { data, status } = await axios.get(url, { timeout: REQUEST_TIMEOUT });
        if (status !== 200) continue;

        const country = extract(data);
        if (country) {
          await TempTransactionStorage.set("user_country", country);
          return country;
        }
      } catch {}
    }

    return undefined;
  } catch (error) {
    console.error("Error fetching location:", error);
    return undefined;
  }
};
