// IPv4 validation regex
const ipv4Regex =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Helper function to validate IPv4
const isValidIPv4 = (ip: string): boolean => ipv4Regex.test(ip.trim());

/**
 * Fetch IPv4 address from multiple sources with fallback
 * @returns Promise resolving to the validated IPv4 address string
 * @throws Error if no valid IPv4 address could be retrieved
 */
export async function getIPAddress(): Promise<string> {
  const sources = [
    {
      url: "https://ipv4.icanhazip.com/",
      extract: async (response: Response) => (await response.text()).trim()
    },
    {
      url: "https://1.0.0.1/cdn-cgi/trace",
      extract: async (response: Response) => {
        const data = await response.text();
        const match = data.match(/ip=([^\n]+)/);
        return match?.[1]?.trim() ?? "";
      }
    }
  ];

  for (const source of sources) {
    try {
      const response = await fetch(source.url);
      if (!response.ok) continue;

      const ip = await source.extract(response);
      if (isValidIPv4(ip)) {
        return ip;
      }
    } catch (error) {
      console.error(`IP lookup failed for ${source.url}:`, error);
      continue;
    }
  }

  throw new Error("Could not retrieve a valid IPv4 address from any source");
}
