export interface Gateway {
  host: string;
  port: number;
  protocol: string;
}

/**
 * Well-known gateways
 */
export const suggestedGateways: Gateway[] = [
  {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "ar-io.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "arweave.dev",
    port: 443,
    protocol: "https"
  },
  {
    host: "g8way.io",
    port: 443,
    protocol: "https"
  }
];

export const testnets: Gateway[] = [
  {
    host: "www.arweave.run",
    port: 443,
    protocol: "https"
  },
  {
    host: "testnet.redstone.tools",
    port: 443,
    protocol: "https"
  }
];

export const fallbackGateway = {
  host: "ar-io.dev",
  port: 443,
  protocol: "https"
};

export const goldskyGateway: Gateway = {
  host: "arweave-search.goldsky.com",
  port: 443,
  protocol: "https"
};

export const clGateway = {
  host: "arweave.ar",
  port: 443,
  protocol: "https"
};

export const defaultGateways = [
  {
    host: "arweave.net",
    port: 443,
    protocol: "https"
  },
  {
    host: "ar-io.dev",
    port: 443,
    protocol: "https"
  },
  clGateway,
  {
    host: "g8way.io",
    port: 443,
    protocol: "https"
  },
  {
    host: "permagate.io",
    port: 443,
    protocol: "https"
  },
  {
    host: "defi.ao",
    port: 443,
    protocol: "https"
  },
  {
    host: "aoweave.tech",
    port: 443,
    protocol: "https"
  }
];

export const printTxWorkingGateways: Gateway[] = [
  goldskyGateway,
  {
    host: "permagate.io",
    port: 443,
    protocol: "https"
  },
  {
    host: "ar-io.dev",
    port: 443,
    protocol: "https"
  },
  {
    host: "arweave.dev",
    port: 443,
    protocol: "https"
  }
];

export const txHistoryGateways = [
  suggestedGateways[1],
  suggestedGateways[0],
  suggestedGateways[3]
];

export const defaultGateway = suggestedGateways[0];
