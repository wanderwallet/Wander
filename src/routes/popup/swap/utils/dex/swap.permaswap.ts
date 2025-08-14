import { connect } from "@permaweb/aoconnect";
import { getTagValue } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress } from "~wallets";
import BigNumber from "bignumber.js";
import { PERMASWAP_SETTLES } from "./dex.constants";
import type {
  GetExpectedOutputParams,
  GetExpectedOutputResponse,
  GetLiquidityParams,
  GetLiquidityResponse,
  SwapExecutionParams,
} from "./dex.types";

const aoInstance = connect(defaultConfig);

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
  swapper,
  slippage,
}: GetExpectedOutputParams): Promise<GetExpectedOutputResponse> {
  swapper = swapper || (await getActiveAddress());
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [
      { name: "Action", value: "GetAmountOut" },
      { name: "TokenIn", value: tokenIn },
      { name: "AmountIn", value: amountIn },
    ],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const amountOut = getTagValue("AmountOut", tags) || "0";
  const issuerFeeQuantity = getTagValue("IssuerFee", tags) || "0";
  const poolFeeQuantity = getTagValue("PoolFee", tags) || "0";
  const holderFeeQuantity = getTagValue("HolderFee", tags) || "0";
  const inputFeeQuantity = BigNumber(issuerFeeQuantity).plus(BigNumber(poolFeeQuantity)).toFixed();
  const outputFeeQuantity = BigNumber(holderFeeQuantity).toFixed();
  const expectedMinOutput = BigNumber(amountOut)
    .multipliedBy(BigNumber(1).minus(slippage))
    .div(100)
    .toFixed(0, BigNumber.ROUND_FLOOR);
  const amountInWithoutFee = BigNumber(amountIn).minus(inputFeeQuantity).toFixed();

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    expectedMinOutput,
    amountInWithoutFee,
    totalTokenInFeeQuantity: inputFeeQuantity,
    totalTokenOutFeeQuantity: outputFeeQuantity,
    type: "permaswap",
  } satisfies GetExpectedOutputResponse;
}

export async function executeSwap({
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  poolId,
  slippage,
  deadline,
}: SwapExecutionParams) {}

export async function getLiquidity({ poolId, tokenIn, tokenOut }: GetLiquidityParams): Promise<GetLiquidityResponse> {
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [{ name: "Action", value: "Info" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const isTokenInX = getTagValue("X", tags) === tokenIn;
  const reserveIn = getTagValue(isTokenInX ? "PX" : "PY", tags) || "0";
  const reserveOut = getTagValue(isTokenInX ? "PY" : "PX", tags) || "0";
  const totalSupply = getTagValue("TotalSupply", tags) || "0";

  return {
    poolId,
    tokenIn,
    tokenOut,
    reserveIn,
    reserveOut,
    totalSupply,
  } satisfies GetLiquidityResponse;
}

export const permaswap = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
};
