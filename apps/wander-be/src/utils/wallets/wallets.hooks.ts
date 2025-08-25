import { useContext } from "react";
import { WalletsContext } from "~utils/wallets/wallets.provider";

export function useWallets() {
  return useContext(WalletsContext);
}
