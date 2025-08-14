import { connect } from "@permaweb/aoconnect";
import { getTagValue } from "~tokens/aoTokens/ao";
import { defaultConfig } from "~tokens/aoTokens/config";
import { getActiveAddress } from "~wallets";
import BigNumber from "bignumber.js";
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
    .multipliedBy(BigNumber(1).minus(slippage || 0))
    .div(100)
    .toFixed(0, BigNumber.ROUND_FLOOR);
  const amountInWithoutFee = amountIn;

  return {
    poolId,
    tokenIn,
    amountIn,
    amountOut,
    expectedMinOutput,
    amountInWithoutFee,
    totalTokenOutFeeQuantity: totalFeeQuantity,
    totalTokenInFeeQuantity: "0",
    type: "botega",
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
}: SwapExecutionParams) {
  const nonce = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export async function getLiquidity({ poolId, tokenIn, tokenOut }: GetLiquidityParams): Promise<GetLiquidityResponse> {
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

  return {
    poolId,
    tokenIn,
    tokenOut,
    reserveIn,
    reserveOut,
    totalSupply,
  } satisfies GetLiquidityResponse;
}

export const botega = {
  getExpectedOutput,
  executeSwap,
  getLiquidity,
};
