import axios from "axios";

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
  for (const { url, extract } of sources) {
    try {
      const { data, status } = await axios.get(url, { timeout: REQUEST_TIMEOUT });

      if (status !== 200) continue;

      const ip = extract(data);
      if (ip) return ip;
    } catch {
      // silent fallback to next provider
    }
  }

  return undefined;
};
