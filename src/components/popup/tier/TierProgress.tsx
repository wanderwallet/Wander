import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import type { ActiveTier } from "~utils/tier/types";
import { ProgressBar } from "./ProgressBar";
import browser from "webextension-polyfill";

interface TierProgressProps {
  activeTier: ActiveTier;
}

export function TierProgress({ activeTier }: TierProgressProps) {
  const currentRank = activeTier?.rank ? `#${activeTier?.rank}` : "-";

  return (
    <Flex direction="column" gap={12}>
      <Flex direction="row" justify="space-between">
        <Text size="sm" weight="medium" noMargin>
          {browser.i18n.getMessage("your_position")}
        </Text>
        <Text weight="semibold" noMargin>
          {currentRank}
        </Text>
      </Flex>

      <ProgressBar progress={activeTier?.progress ?? 0} />
    </Flex>
  );
}
