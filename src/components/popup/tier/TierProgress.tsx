import { Text, Tooltip } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import type { ActiveTier, Tier } from "~utils/tier/types";
import { ProgressBar } from "./ProgressBar";
import browser from "webextension-polyfill";
import { HelpCircle } from "@untitled-ui/icons-react";
import styled from "styled-components";

interface TierProgressProps {
  activeTier: ActiveTier;
  highlightTierLabel?: string;
}

export function TierProgress({ activeTier, highlightTierLabel }: TierProgressProps) {
  const currentRank = activeTier?.rank ? `#${activeTier?.rank}` : "-";

  return (
    <Flex direction="column" gap={12}>
      <Flex direction="row" justify="space-between">
        <Text size="sm" weight="medium" noMargin>
          {browser.i18n.getMessage("your_position")}
        </Text>
        <Flex direction="row" gap={4} align="center">
          <Text weight="semibold" noMargin>
            {currentRank}
          </Text>
          <HelpTooltip />
        </Flex>
      </Flex>

      <ProgressBar progress={activeTier?.progress ?? 0} highlightTierLabel={highlightTierLabel} />
    </Flex>
  );
}

const HelpTooltip = () => {
  return (
    <StyledTooltip
      content={
        <Text style={{ maxWidth: 220, textAlign: "center" }} size="sm" weight="medium" noMargin>
          {browser.i18n.getMessage("position_update_tooltip")}
        </Text>
      }
      position="left">
      <HelpCircleIcon />
    </StyledTooltip>
  );
};

const HelpCircleIcon = styled(HelpCircle)`
  height: 16px;
  width: 16px;
  cursor: pointer;
  color: ${({ theme }) => theme.secondaryText};
`;

const StyledTooltip = styled(Tooltip)`
  margin-right: 6px;
`;
