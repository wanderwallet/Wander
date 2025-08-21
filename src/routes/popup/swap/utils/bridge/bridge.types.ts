export interface BridgeInfo {
  bridgePid: string;
  arLocker: string;
  chainTokens: Array<{
    chainType: string;
    chainId: number;
    symbol: string;
    decimals: number;
    stableRange: number;
    locker: string;
    tokenId: string;
    wrappedTokenId: string;
  }>;
  wrappedTokens: Array<{
    wrappedTokenId: string;
    name: string;
    ticker: string;
    denomination: string;
    totalSupply: string;
    minBurnAmt: string;
    burnFee: string;
    feeRecipient: string;
    mintFee: string;
    holderNum: string;
    bridgeProcessId: string;
  }>;
  burnLimits: Record<
    string,
    {
      dailyDate: string;
      dailyLimit: string;
      dailyBurned: string;
      perLimit: string;
    }
  >;
  mintLimits: Record<string, number>;
  HmBridgeTokenPairs: Record<
    string,
    {
      tokenId: string;
      name: string;
      ticker: string;
    }
  >;
  closeServer: {
    closeBaseMint: boolean;
    closeEthMint: boolean;
    closeBscMint: boolean;
    closeArweaveMint: boolean;
    closeEthBurn: boolean;
    closeBscBurn: boolean;
    closeArweaveBurn: boolean;
    closeTransfer: boolean;
  };
}
