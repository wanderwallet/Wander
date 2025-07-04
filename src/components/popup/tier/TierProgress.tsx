import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import type { ActiveTier } from "~utils/tier/types";
import { ProgressBar } from "./ProgressBar";

interface TierProgressProps {
  activeTier: ActiveTier;
}

export function TierProgress({ activeTier }: TierProgressProps) {
  const currentRank = activeTier?.progress?.currentRank ? `#${activeTier?.progress?.currentRank}` : "-";

  return (
    <Flex direction="column" gap={12}>
      <Flex direction="row" justify="space-between">
        <Text size="sm" weight="medium" noMargin>
          Your position
        </Text>
        <Text weight="semibold" noMargin>
          {currentRank}
        </Text>
      </Flex>

      <ProgressBar progress={activeTier?.progress?.progressPercent ?? 0} />
    </Flex>
  );
}
