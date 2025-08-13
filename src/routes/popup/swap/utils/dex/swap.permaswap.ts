import { connect } from "@permaweb/aoconnect";
import { getTagValue } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress } from "~wallets";
import BigNumber from "bignumber.js";
import { PERMASWAP_SETTLES } from "./dex.constants";

const aoInstance = connect(defaultConfig);

interface GetExpectedOutputParams {
  poolId: string;
  tokenIn: string;
  amountIn: string;
  swapper?: string;
  slippagePercentage?: number;
}

export async function getExpectedOutput({
  poolId,
  tokenIn,
  amountIn,
  swapper,
  slippagePercentage,
}: GetExpectedOutputParams) {
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
  const totalFeeQuantity = BigNumber(issuerFeeQuantity).plus(BigNumber(poolFeeQuantity)).toFixed();
  const outputFeeQuantity = BigNumber(holderFeeQuantity).toFixed();
  const expectedMinOutput = BigNumber(amountOut)
    .multipliedBy(BigNumber(1).minus(slippagePercentage))
    .div(100)
    .toFixed();

  return {
    amountOut,
    expectedMinOutput,
    totalTokenInFeeQuantity: totalFeeQuantity,
    totalTokenOutFeeQuantity: outputFeeQuantity,
  };
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

export async function executeSwap({
  tokenIn,
  tokenOut,
  amountIn,
  minAmountOut,
  poolId,
  slippage,
  deadline,
}: SwapExecutionParams) {}

interface GetLiquidityParams {
  poolId: string;
  tokenIn: string;
  tokenOut: string;
}

export async function getLiquidity({ poolId, tokenIn, tokenOut }: GetLiquidityParams) {
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [{ name: "Action", value: "Info" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const reserveIn = getTagValue("PX", tags) || "0";
  const reserveOut = getTagValue("PY", tags) || "0";
  const totalSupply = getTagValue("TotalSupply", tags) || "0";

  const feeInfo = await getFee(poolId);

  return {
    poolId,
    tokenIn,
    tokenOut,
    reserveIn,
    reserveOut,
    totalSupply,
    feeInfo,
  };
}

export async function getFee(poolId: string) {
  const response = await aoInstance.dryrun({
    process: poolId,
    tags: [{ name: "Action", value: "Info" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const poolFeePercentage = getTagValue("PoolFeeRatio", tags) || "0";

  const settle = PERMASWAP_SETTLES[Math.floor(Math.random() * PERMASWAP_SETTLES.length)];

  const settleResponse = await aoInstance.dryrun({
    process: settle,
    tags: [{ name: "Action", value: "Info" }],
  });

  const settleTags = settleResponse?.Messages?.[0]?.Tags || [];
  const issuerFeePercentage = getTagValue("IssuerFeeRatio", settleTags) || "0";
  const holderFeePercentage = getTagValue("HolderFeeRatio", settleTags) || "0";

  return {
    poolFeePercentage,
    issuerFeePercentage,
    holderFeePercentage,
  };
}
