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
  type: "botega" | "permaswap";
}

export interface SwapExecutionParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  poolId: string;
  slippage?: number;
  deadline?: number;
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
  feeInfo: Record<string, any>;
}
