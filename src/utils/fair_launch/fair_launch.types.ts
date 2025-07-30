import type { TokenInfo } from "~tokens/aoTokens/ao";

export interface FlpTokenInfo extends TokenInfo {
  flpId: string;
  autoClaim: boolean;
}
