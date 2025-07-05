import styled from "styled-components";
import coreBackground from "~assets/images/tier/core_card_bg.png";
import selectBackground from "~assets/images/tier/select_card_bg.png";
import plusBackground from "~assets/images/tier/plus_card_bg.png";
import primeBackground from "~assets/images/tier/prime_card_bg.png";
import eliteBackground from "~assets/images/tier/elite_card_bg.png";

import coreBackgroundLight from "~assets/images/tier/core_card_bg_light.png";
import selectBackgroundLight from "~assets/images/tier/select_card_bg_light.png";
import plusBackgroundLight from "~assets/images/tier/plus_card_bg_light.png";
import primeBackgroundLight from "~assets/images/tier/prime_card_bg_light.png";
import eliteBackgroundLight from "~assets/images/tier/elite_card_bg_light.png";

import type { Tier } from "~utils/tier/types";

const backgrounds = {
  dark: {
    Core: coreBackground,
    Select: selectBackground,
    Reserve: plusBackground,
    Edge: primeBackground,
    Prime: eliteBackground,
  },
  light: {
    Core: coreBackgroundLight,
    Select: selectBackgroundLight,
    Reserve: plusBackgroundLight,
    Edge: primeBackgroundLight,
    Prime: eliteBackgroundLight,
  },
};

export const TierCard = styled.div<{ tier: Tier; hideBorder?: boolean; hideBackground?: boolean }>`
  display: flex;
  padding: 16px;
  gap: 8px;
  flex-direction: column;
  position: relative;
  align-items: center;
  border-radius: 8px;
  border: ${(props) => (props.hideBorder ? "none" : "1px solid rgba(255, 255, 255, 0.1)")};
  background: ${(props) =>
    props.hideBackground
      ? "transparent"
      : `url(${backgrounds[props.theme.displayTheme][props.tier]}) no-repeat center center`};
  background-size: cover;
  background-position: center;
`;
