import { connect } from "@permaweb/aoconnect";
import { getTagValue } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress } from "~wallets";
import BigNumber from "bignumber.js";

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
      { name: "Action", value: "Get-Swap-Output" },
      { name: "Token", value: tokenIn },
      { name: "Quantity", value: amountIn },
      { name: "Swapper", value: swapper },
    ],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const amountOut = getTagValue("Output", tags) || "0";
  const lpFeeQuantity = getTagValue("LP-Fee-Quantity", tags) || "0";
  const protocolFeeQuantity = getTagValue("Protocol-Fee-Quantity", tags) || "0";
  const totalFeeQuantity = BigNumber(lpFeeQuantity).plus(protocolFeeQuantity).toFixed();
  const expectedMinOutput = BigNumber(amountOut)
    .multipliedBy(BigNumber(1).minus(slippagePercentage || 0))
    .div(100)
    .toFixed();

  return {
    amountOut,
    expectedMinOutput,
    totalTokenOutFeeQuantity: totalFeeQuantity,
    totalTokenInFeeQuantity: "0",
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
    tags: [{ name: "Action", value: "Get-Reserves" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const reserveIn = getTagValue(tokenIn, tags) || "0";
  const reserveOut = getTagValue(tokenOut, tags) || "0";

  const infoResponse = await aoInstance.dryrun({
    process: poolId,
    tags: [{ name: "Action", value: "Info" }],
  });

  const infoTags = infoResponse?.Messages?.[0]?.Tags || [];
  const totalSupply = getTagValue("TotalSupply", infoTags) || "0";

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
    tags: [{ name: "Action", value: "Get-Fee-Percentage" }],
  });

  const tags = response?.Messages?.[0]?.Tags || [];
  const protocolFeePercentage = getTagValue("Protocol-Fee-Percentage", tags) || "0";
  const lpFeePercentage = getTagValue("LP-Fee-Percentage", tags) || "0";
  const totalFeePercentage = getTagValue("Fee-Percentage", tags) || "0";

  return {
    protocolFeePercentage,
    lpFeePercentage,
    totalFeePercentage,
  };
}
