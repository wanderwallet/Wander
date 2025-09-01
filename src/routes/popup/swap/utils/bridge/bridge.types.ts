export interface AoxBridgeInfo {
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

export interface VentoBridgeInfo {
  MININUM_ARWEAVE_BRIDGE: string;
  FEES: { AR: number };
}

export interface VentoHealthInfo {
  status: string;
  apiStatus: number;
}

export type AoxBridgeTransactionStatus =
  | "unPackaged"
  | "waiting"
  | "confirmed"
  | "wrapping"
  | "burning"
  | "executing"
  | "success"
  | "failed"
  | "submintAosFailed"
  | "notOnChain"
  // special case, comes from errMsg not status:
  | "refunded";

export interface AoxBridgeTransaction {
  rawId: number;
  createdAt: string;
  updatedAt: string;
  txType: string;
  chainType: string;
  txId: string;
  sender: string;
  recipient: string;
  quantity: string;
  symbol: string;
  decimals: number;
  blockHeight: number;
  fromTokenId: string;
  toTokenId: string;
  fee: string;
  feeRecipient: string;
  confirmNum: number;
  confirmRange: number;
  status: AoxBridgeTransactionStatus;
  targetChainTxHash: string;
  errMsg?: string;
}

export interface AoxBridgeTransactionResponse {
  txs: AoxBridgeTransaction[];
  hasNextPage: boolean;
}

export interface VentoBridgeTransaction {
  _id: string;
  txId: string;
  type: "deposit" | "burn";
  failureReason: string;
  status: "pending confirmation" | "filled" | "failed" | "open" | "pending";
  inputChain: "arweave" | "ao";
  inputTokenType: "arweave" | "ao";
  inputTokenAddress: "AR";
  inputAmountRaw: string;
  openedAt: string;
  closedAt: string;
  outputChain: "arweave" | "ao";
  outputTokenType: "arweave" | "ao";
  outputTokenAddress: string;
  outputAmountRaw: string;
  outputTxId: string;
  senderWallet: string;
  recipientWallet: string;
  feeChargedRaw: string;
  networkFeeRaw: string;
  retryCount: number;
  availableAt: string;
  claimedAt: string;
  updatedAt: string;
}

export interface VentoBridgeTransactionResponse extends VentoBridgeTransaction {}

export interface AoxBridgeInfoResult {
  bridge: "aox" | "vento";
  arToken: AoxBridgeInfo["chainTokens"][number];
  warToken: AoxBridgeInfo["wrappedTokens"][number];
  warBurnLimit: AoxBridgeInfo["burnLimits"][string];
  arMintLimit: number;
  arMintDisabled: boolean;
  warBurnDisabled: boolean;
}

export interface VentoBridgeInfoResult {
  bridge: "aox" | "vento";
  minBridgeAmount: string;
  isHealthy: boolean;
  bridgeFeeRate: number;
}
