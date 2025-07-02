import browser from "webextension-polyfill";
import styled from "styled-components";
import HeadV2 from "~components/popup/HeadV2";
import { Award03, Percent02, Star01 } from "@untitled-ui/icons-react";
import { WanderIcon } from "~components/popup/tier/WanderIcon";
import { SHOW_TIER_FEATURES } from "~utils/tier/constants";
import { Text } from "@arconnect/components-rebrand";
import { Flex } from "~components/common/Flex";
import wanderIcon from "~assets/ecosystem/wander.svg";
import { defaultStars, AnimatedStarContainer } from "~components/common/AnimatedStarContainer";
import { useState } from "react";
import { useAsyncEffect } from "~utils/react/useAsyncEffect";
import { ExtensionStorage } from "~utils/storage";
import powerupsIcon from "~assets/images/tier/powerups.svg";
import { ProgressBar } from "~components/popup/tier/ProgressBar";
import { TierButton } from "~components/popup/tier/TierButton";
import { TierWrapper } from "~components/popup/tier/TierWrapper";
import { TierCard } from "~components/popup/tier/TierCard";
import { useActiveTier } from "~utils/tier/hooks";
import { balanceToFractioned } from "~tokens/currency";
import { TiersPopup } from "~components/popup/tier/TiersPopup";

const stars = defaultStars.toSpliced(1, 1);

const features = [
  {
    icon: <Percent02 height={16} width={16} />,
    title: "Exclusive feature access",
  },
  {
    icon: <Star01 height={16} width={16} />,
    title: "Exclusive feature access",
  },
  {
    icon: <img src={powerupsIcon} alt="Powerups" height={16} width={16} />,
    title: "Power ups with partners",
  },
];

export function TierView() {
  const [isOpen, setOpen] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const { data: activeTier } = useActiveTier();

  const tier = activeTier?.tier ?? "Select";

  const handleCloseCTA = () => {
    ExtensionStorage.set(SHOW_TIER_FEATURES, false);
    setShowFeatures(false);
  };

  useAsyncEffect(async () => {
    const storedValue = await ExtensionStorage.get<boolean>(SHOW_TIER_FEATURES);
    setShowFeatures(storedValue ?? true);
  }, []);

  return (
    <>
      <HeadV2
        title={browser.i18n.getMessage("your_tier")}
        optionsIcon={
          <OptionsIconWrapper onClick={() => setOpen(true)}>
            <OptionsIcon />
          </OptionsIconWrapper>
        }
      />
      <TierWrapper tier={tier}>
        <TierCard tier={tier}>
          <Flex direction="row" gap={4} align="center" justify="center">
            <WanderIcon tier={tier} />
            <Text size="xs" weight="semibold" noMargin>
              {tier}
            </Text>
          </Flex>
          <Flex direction="row" gap={4} align="baseline" justify="center">
            <Text size="4xl" weight="semibold" noMargin>
              {balanceToFractioned(String(activeTier?.progress?.currentBalance ?? 0), { decimals: 12 }).toFixed(2)}
            </Text>
            <Text variant="secondary" weight="medium" noMargin>
              WAND
            </Text>
            <img src={wanderIcon} alt="Wander" height={24} width={24} />
          </Flex>
        </TierCard>

        <TierButton
          tier={tier}
          onClick={() => {
            browser.tabs.create({ url: "https://ao.arweave.net/#/delegate/" });
          }}>
          Get WAND tokens
        </TierButton>

        {showFeatures && (
          <AnimatedStarContainer padding="16px" stars={stars} onClose={handleCloseCTA} showCloseButton>
            <Flex direction="column" gap={12}>
              {features.map((feature) => (
                <Flex direction="row" gap={8}>
                  <IconWrapper>{feature.icon}</IconWrapper>
                  <Text weight="semibold" noMargin>
                    {feature.title}
                  </Text>
                </Flex>
              ))}
            </Flex>
          </AnimatedStarContainer>
        )}

        <Flex direction="column" gap={12} style={{ marginTop: 16 }}>
          <Flex direction="row" justify="space-between">
            <Text size="sm" weight="medium" noMargin>
              Your position
            </Text>
            <Text weight="semibold" noMargin>
              #{activeTier?.progress?.currentRank || 0}
            </Text>
          </Flex>

          <ProgressBar progress={activeTier?.progress?.progressPercent ?? 0} />

          <Flex direction="row" gap={8} margin="16px 0 0 0">
            <Text weight="semibold" noMargin>
              Activity
            </Text>
          </Flex>
        </Flex>
      </TierWrapper>

      <TiersPopup isOpen={isOpen} setOpen={setOpen} />
    </>
  );
}

const OptionsIcon = styled(Award03)`
  height: 20px;
  width: 20px;
`;

const OptionsIconWrapper = styled.div`
  display: flex;
  width: 28px;
  height: 28px;
  padding: 4px;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  border-radius: 8px;
  background: #2c2c2e;

  &:active ${OptionsIcon} {
    transform: scale(0.93);
  }
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #342888;
  display: flex;
  align-items: center;
  justify-content: center;
`;
