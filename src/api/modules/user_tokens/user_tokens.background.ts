import type { BackgroundModuleFunction } from "~api/background/background-modules";
import { ExtensionStorage } from "~utils/storage";
import {
  getAoTokenBalance,
  type TokenInfo,
  type TokenInfoWithBalance
} from "~tokens/aoTokens/ao";

const background: BackgroundModuleFunction<
  TokenInfoWithBalance[] | TokenInfo[]
> = async (_, options?: { fetchBalance?: boolean }) => {
  const address = await ExtensionStorage.get("active_address");
  const tokens = (
    (await ExtensionStorage.get<TokenInfo[]>("ao_tokens")) || []
  ).filter((token) => token.processId !== "AR");

  if (!options?.fetchBalance) {
    return tokens;
  }

  const enrichedTokens: TokenInfoWithBalance[] = await Promise.all(
    tokens.map(async (token) => {
      let balance: string | null = null;

      try {
        const balanceResult = await getAoTokenBalance(address, token.processId);
        balance = balanceResult.toString();
      } catch (error) {
        console.error(
          `Error fetching balance for token ${token.Name} (${token.processId}):`,
          error
        );
      }

      return { ...token, balance };
    })
  );

  return enrichedTokens;
};

export default background;
