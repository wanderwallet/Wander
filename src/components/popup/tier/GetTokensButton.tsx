import { TierButton } from "~components/popup/tier/TierButton";
import browser from "webextension-polyfill";
import type { Tier } from "~utils/tier/types";
import { EventType, trackEvent } from "~utils/analytics";
import { Button } from "@arconnect/components-rebrand";

interface GetTokensButtonProps {
  tier?: Tier;
  variant: "tier" | "normal";
}

export function GetTokensButton({ tier, variant = "tier" }: GetTokensButtonProps) {
  const handleClick = () => {
    trackEvent(EventType.GET_WANDER_TOKENS, {});
    browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" });
  };

  const buttonText = browser.i18n.getMessage("get_wander_tokens");

  return variant === "normal" ? (
    <Button fullWidth onClick={handleClick}>
      {buttonText}
    </Button>
  ) : (
    <TierButton tier={tier} onClick={handleClick}>
      {buttonText}
    </TierButton>
  );
}
