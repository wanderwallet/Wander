import axios from "axios";
import { TempTransactionStorage } from "./storage";

type Source = {
  url: string;
  extract: (data: any) => string | undefined;
};

const sources: Source[] = [
  {
    url: "https://ipv4.icanhazip.com/",
    extract: (data) => (typeof data === "string" ? data.trim() : undefined),
  },
  {
    url: "https://1.0.0.1/cdn-cgi/trace",
    extract: (data) => (typeof data === "string" ? data.match(/ip=([^\n]+)/)?.[1]?.trim() : undefined),
  },
  {
    url: "https://ipinfo.io/json",
    extract: (data) => data?.ip,
  },
  {
    url: "https://api.ipify.org?format=json",
    extract: (data) => data?.ip,
  },
  {
    url: "https://api64.ipify.org?format=json",
    extract: (data) => data?.ip,
  },
  {
    url: "https://ipapi.co/json/",
    extract: (data) => data?.ip,
  },
];

const REQUEST_TIMEOUT = 3000;

/**
 * Get user's public IP address
 * Tries multiple providers with fallback
 */
export const getUserIP = async (): Promise<string | undefined> => {
  const cachedIP = await TempTransactionStorage.get<string>("user_ip");
  if (cachedIP) return cachedIP;

  for (const { url, extract } of sources) {
    try {
      const { data, status } = await axios.get(url, { timeout: REQUEST_TIMEOUT });
      if (status !== 200) continue;

      const ip = extract(data);
      if (ip) {
        await TempTransactionStorage.set("user_ip", ip);
        return ip;
      }
    } catch {}
  }

  return undefined;
};
