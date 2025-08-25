import type { Tag } from "~utils/agents/types";

export interface GetExpectedOutputParams {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  swapper?: string;
  slippage?: number;
}

export interface GetExpectedOutputResponse {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  amountOut: string;
  expectedMinOutput: string;
  amountInWithoutFee: string;
  totalTokenOutFeeQuantity: string;
  totalTokenInFeeQuantity: string;
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
