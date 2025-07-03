import { TierButton } from "~components/popup/tier/TierButton";
import browser from "webextension-polyfill";
import type { Tier } from "~utils/tier/types";

export function GetTokensButton({ tier }: { tier: Tier }) {
  return (
    <TierButton tier={tier} onClick={() => browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" })}>
      {browser.i18n.getMessage("get_wander_tokens")}
    </TierButton>
  );
}
