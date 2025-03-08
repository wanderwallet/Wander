interface GatewayResponse {
  version: number;
  release: number;
  queue_length: number;
  peers: number;
  node_state_latency: number;
  network: string;
  height: number;
  current: string;
  blocks: number;
}

/**
 * Determines if a given URL is a gateway.
 * @param url - The URL to check.
 * @returns - A boolean indicating whether the URL is a gateway.
 */
export async function isGateway(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const data = (await response.json()) as Partial<GatewayResponse>;

    // Check if the response contains all expected keys
    const requiredKeys: (keyof GatewayResponse)[] = [
      "version",
      "release",
      "queue_length",
      "peers",
      "node_state_latency",
      "network",
      "height",
      "current",
      "blocks"
    ];

    return requiredKeys.every((key) => key in data);
  } catch (error) {
    console.error(`Error fetching data from URL: ${url}`, error);
    return false;
  }
}
