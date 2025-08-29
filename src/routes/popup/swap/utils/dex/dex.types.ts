import type { dryrun } from "@permaweb/aoconnect";
import type { Tag } from "~utils/agents/types";

export interface GetExpectedOutputParams {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  wanderFee: string;
  swapper?: string;
  slippage?: number;
}

export interface GetExpectedOutputResponse {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  amountOut: string;
  wanderFee: string;
  transferAmountIn: string;
  minAmountOut: string;
  poolAmountIn: string;
  tokenOutFee: string;
  tokenInFee: string;
  type: "aox" | "botega" | "permaswap" | "vento";
}

export interface SwapExecutionParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  poolId: string;
  slippage?: number;
  deadline?: number;
  tags?: Tag[];
}

export interface SwapExecutionResponse {
  transferId: string;
  noteSettle?: string;
}

export interface GetLiquidityParams {
  poolId: string;
  tokenIn: string;
  tokenOut: string;
}

export interface GetLiquidityResponse {
  poolId: string;
  tokenIn: string;
  tokenOut: string;
  reserveIn: string;
  reserveOut: string;
  totalSupply: string;
}

export interface Message {
  Tags: Tag[];
}

export interface AoMessage {
  id: string;
  type: string;
  from: string;
  to: string;
  blockHeight: number;
  schedulerId: string;
  blockTimestamp: Date;
  action: string;
  tags: Record<string, string>;
  systemTags: Record<string, string>;
  userTags: Record<string, string>;
  cursor: string;
  dataSize: number;
}

export interface ReadSwapResult {
  orderId: string;
  swapper?: string;
  noteSettle?: string; // For Permaswap
}

export interface ReadSwapResultResponse {
  amountOut: string;
  confirmationTxId: string;
}

export interface WaitForSwapResultResponse {
  success: boolean;
  result: ReadSwapResultResponse | null;
}

export type DryRunResult = Awaited<ReturnType<typeof dryrun>>;

export interface PermaswapGetSettled {
  SettledDate: number;
  NoteIDs: string;
  Fees: string;
  Status: "Open" | "Started" | "Executing" | "Settled" | "Rejected" | "Timeout" | "Expired" | "Canceled";
  SettleID: string;
  TxsIn: string;
  ID: number;
  TxsOut: string;
  Settler: string;
}
