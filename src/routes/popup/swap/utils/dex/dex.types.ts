import type { dryrun } from "@permaweb/aoconnect";
import type { Tag } from "~utils/agents/types";

export interface GetExpectedOutputParams {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  wanderFee: string;
  networkFee: string;
  swapper?: string;
  slippage?: number;
}

export interface GetExpectedOutputResponse {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  amountOut: string;
  wanderFee: string;
  networkFee: string;
  transferAmountIn: string;
  minAmountOut: string;
  poolAmountIn: string;
  tokenOutFee: string;
  tokenInFee: string;
  type: "aox" | "botega" | "permaswap";
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

export type DryRunResult = Awaited<ReturnType<typeof dryrun>>;
