import { tokenData } from "liquidops";

export function getBaseDenomination(ticker: string) {
  return tokenData[ticker].baseDenomination;
}
