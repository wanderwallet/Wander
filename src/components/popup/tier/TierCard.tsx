import styled from "styled-components";
import coreBackground from "~assets/images/tier/core_card_bg.png";
import selectBackground from "~assets/images/tier/select_card_bg.png";
import plusBackground from "~assets/images/tier/plus_card_bg.png";
import primeBackground from "~assets/images/tier/prime_card_bg.png";
import eliteBackground from "~assets/images/tier/elite_card_bg.png";
import stars from "~assets/images/tier/stars.svg";
import type { Tier } from "~utils/tier/types";

const tierStyles = {
  Core: {
    background: coreBackground,
  },
  Select: {
    background: selectBackground,
  },
  Plus: {
    background: plusBackground,
  },
  Prime: {
    background: primeBackground,
  },
  Elite: {
    background: eliteBackground,
  },
};

export const TierCard = styled.div<{ tier: Tier }>`
  display: flex;
  padding: 16px;
  flex-direction: column;
  align-items: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: url(${(props) => tierStyles[props.tier].background}) no-repeat center center;
  background-size: cover;
  background-position: center;
`;
