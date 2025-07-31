import styled, { useTheme } from "styled-components";
import { Loading, Text, DefaultTheme } from "@arconnect/components-rebrand";
import { useActiveTier } from "~utils/tier/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { WanderIcon } from "./WanderIcon";
import { TierTypes } from "~utils/tier/constants";
import { EventType, trackEvent } from "~utils/analytics";
import RaysCore from "~assets/images/tier/rays_core.png";
import RaysElite from "~assets/images/tier/rays_elite.png";
import RaysPrime from "~assets/images/tier/rays_prime.png";
import RaysPlus from "~assets/images/tier/rays_plus.png";
import RaysSelect from "~assets/images/tier/rays_select.png";

const rays = {
  [TierTypes.Core]: RaysCore,
  [TierTypes.Prime]: RaysElite,
  [TierTypes.Edge]: RaysPrime,
  [TierTypes.Reserve]: RaysPlus,
  [TierTypes.Select]: RaysSelect,
};

const activeBoxShadows = {
  dark: {
    [TierTypes.Prime]:
      "inset 0px 1px 1px rgba(234, 208, 131, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(216, 187, 81, 0.3), inset 0px 1px 8px rgba(125, 102, 35, 0.2)",
    [TierTypes.Edge]:
      "inset 0px 1px 1px rgba(212, 212, 212, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(212, 212, 212, 0.3), inset 0px 1px 8px rgba(153, 153, 153, 0.2)",
    [TierTypes.Reserve]:
      "inset 0px 1px 1px rgba(134, 229, 169, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(134, 229, 169, 0.3), inset 0px 1px 8px rgba(48, 171, 93, 0.2)",
    [TierTypes.Select]:
      "inset 0px 1px 1px rgba(131, 215, 245, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(131, 215, 245, 0.3), inset 0px 1px 8px rgba(13, 136, 207, 0.2)",
    [TierTypes.Core]:
      "inset 0px 1px 1px rgba(151, 135, 255, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(107, 87, 249, 0.3), inset 0px 1px 8px rgba(107, 87, 249, 0.2)",
  },
  light: {
    [TierTypes.Prime]:
      "inset 0px 1px 1px rgba(185, 149, 42, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(255, 241, 189, 0.3), inset 0px 1px 8px rgba(234, 208, 131, 0.2)",
    [TierTypes.Edge]:
      "inset 0px 1px 1px rgba(153, 153, 153, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(212, 212, 212, 0.3), inset 0px 1px 8px rgba(153, 153, 153, 0.2)",
    [TierTypes.Reserve]:
      "inset 0px 1px 1px rgba(48, 171, 93, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(134, 229, 169, 0.3), inset 0px 1px 8px rgba(48, 171, 93, 0.2)",
    [TierTypes.Select]:
      "inset 0px 1px 1px rgba(34, 134, 172, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(131, 215, 245, 0.3), inset 0px 1px 8px rgba(34, 134, 172, 0.2)",
    [TierTypes.Core]:
      "inset 0px 1px 1px rgba(107, 87, 249, 0.6), inset 0px 1px 2px rgba(255, 255, 255, 0.6), inset 0px 2px 12px rgba(107, 87, 249, 0.3), inset 0px 1px 8px rgba(107, 87, 249, 0.2)",
  },
};

const boxShadows = {
  dark: {
    [TierTypes.Prime]:
      "inset 0 0 6px rgba(216, 187, 81, 0.3), inset 0 1px 2px rgba(234, 208, 131, 0.5), inset 0 -1px 2px rgba(234, 208, 131, 0.4), inset 1px 0 2px rgba(234, 208, 131, 0.4), inset -1px 0 2px rgba(234, 208, 131, 0.4)",
    [TierTypes.Edge]:
      "inset 0 0 6px rgba(6, 45, 60, 0.2), inset 0 1px 2px rgba(212, 212, 212, 0.4), inset 0 -1px 2px rgba(212, 212, 212, 0.3), inset 1px 0 2px rgba(212, 212, 212, 0.3), inset -1px 0 2px rgba(212, 212, 212, 0.3)",
    [TierTypes.Reserve]:
      "inset 0 0 6px rgba(8, 59, 88, 0.25), inset 0 1px 2px rgba(134, 229, 169, 0.4), inset 0 -1px 2px rgba(134, 229, 169, 0.3), inset 1px 0 2px rgba(134, 229, 169, 0.3), inset -1px 0 2px rgba(134, 229, 169, 0.3)",
    [TierTypes.Select]:
      "inset 0 0 6px rgba(8, 59, 88, 0.25), inset 0 1px 2px rgba(131, 215, 245, 0.4), inset 0 -1px 2px rgba(131, 215, 245, 0.3), inset 1px 0 2px rgba(131, 215, 245, 0.3), inset -1px 0 2px rgba(131, 215, 245, 0.3)",
    [TierTypes.Core]:
      "inset 0 0 6px rgba(107, 87, 249, 0.25), inset 0 1px 2px rgba(151, 135, 255, 0.4), inset 0 -1px 2px rgba(151, 135, 255, 0.3), inset 1px 0 2px rgba(151, 135, 255, 0.3), inset -1px 0 2px rgba(151, 135, 255, 0.3)",
  },
  light: {
    [TierTypes.Prime]:
      "inset 0 0 6px rgba(255, 241, 189, 0.3), inset 0 1px 2px rgba(185, 149, 42, 0.5), inset 0 -1px 2px rgba(185, 149, 42, 0.4), inset 1px 0 2px rgba(185, 149, 42, 0.4), inset -1px 0 2px rgba(185, 149, 42, 0.4)",
    [TierTypes.Edge]:
      "inset 0 0 6px rgba(6, 45, 60, 0.1), inset 0 1px 2px rgba(153, 153, 153, 0.4), inset 0 -1px 2px rgba(153, 153, 153, 0.3), inset 1px 0 2px rgba(153, 153, 153, 0.3), inset -1px 0 2px rgba(153, 153, 153, 0.3)",
    [TierTypes.Reserve]:
      "inset 0 0 6px rgba(134, 229, 169, 0.3), inset 0 1px 2px rgba(48, 171, 93, 0.4), inset 0 -1px 2px rgba(48, 171, 93, 0.3), inset 1px 0 2px rgba(48, 171, 93, 0.3), inset -1px 0 2px rgba(48, 171, 93, 0.3)",
    [TierTypes.Select]:
      "inset 0 0 6px rgba(131, 215, 245, 0.3), inset 0 1px 2px rgba(34, 134, 172, 0.4), inset 0 -1px 2px rgba(34, 134, 172, 0.3), inset 1px 0 2px rgba(34, 134, 172, 0.3), inset -1px 0 2px rgba(34, 134, 172, 0.3)",
    [TierTypes.Core]:
      "inset 0 0 6px rgba(107, 87, 249, 0.3), inset 0 1px 2px rgba(107, 87, 249, 0.4), inset 0 -1px 2px rgba(107, 87, 249, 0.3), inset 1px 0 2px rgba(107, 87, 249, 0.3), inset -1px 0 2px rgba(107, 87, 249, 0.3)",
  },
};

interface TierTagProps {
  tier: TierTypes;
  iconHeight?: number;
  iconWidth?: number;
  textSize?: string;
  gap?: number;
  boxShadowType?: "active" | "normal";
  theme?: DefaultTheme;
}

export function ActiveTierTag() {
  const { data: activeTier, isLoading } = useActiveTier();
  const theme = useTheme();
  const { navigate } = useLocation();
  const boxShadow =
    activeBoxShadows[theme.displayTheme][activeTier?.tier] || activeBoxShadows[theme.displayTheme][TierTypes.Core];
  const raysBackground = rays[activeTier?.tier] || rays[TierTypes.Core];

  function handleClick() {
    trackEvent(EventType.VIEW_BENEFITS, {});
    navigate("/tier");
  }

  return (
    <Tag raysBackground={raysBackground} boxShadow={boxShadow} onClick={handleClick}>
      <WanderIcon height={9.37} width={20} tier={activeTier?.tier} />
      {isLoading ? (
        <Loading style={{ width: "20px", height: "20px" }} />
      ) : (
        <Text weight="medium" noMargin>
          {activeTier?.tier || TierTypes.Core}
        </Text>
      )}
    </Tag>
  );
}

export function TierTag({
  tier,
  iconHeight = 7.5,
  iconWidth = 16,
  textSize = "12px",
  boxShadowType = "normal",
  theme,
}: TierTagProps) {
  const currentTheme = useTheme();
  const resolvedTheme = theme || currentTheme;
  const selectedBoxShadows = boxShadowType === "active" ? activeBoxShadows : boxShadows;
  const boxShadow =
    selectedBoxShadows[resolvedTheme.displayTheme][tier] ||
    selectedBoxShadows[resolvedTheme.displayTheme][TierTypes.Core];

  return (
    <Tag gap={4} boxShadow={boxShadow} theme={resolvedTheme}>
      <WanderIcon height={iconHeight} width={iconWidth} tier={tier} theme={resolvedTheme} />
      <Text style={{ fontSize: textSize }} weight="medium" theme={resolvedTheme} noMargin>
        {tier}
      </Text>
    </Tag>
  );
}

const Tag = styled.div<{ boxShadow?: string; raysBackground?: string; gap?: number }>`
  display: flex;
  padding: 4px 8px;
  align-items: center;
  gap: ${(props) => props.gap || 8}px;
  cursor: pointer;
  position: relative;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  background: ${(props) => props.theme.surfaceDefault};
  backdrop-filter: blur(7.550000190734863px);

  ${(props) =>
    props.raysBackground &&
    `
    &::before {
      content: "";
      position: absolute;
      top: -35px;
      left: -15px;
      width: 114px;
      height: 114px;
      background-image: url(${props.raysBackground});
      background-size: 90%;
      background-position: center;
      background-repeat: no-repeat;
      pointer-events: none;
      opacity: ${props.theme.displayTheme === "dark" ? 0.4 : 1};
      z-index: -3;
    }
  `}

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${(props) => props.theme.surfaceDefault};
    box-shadow: ${(props) => props.boxShadow || "none"};
    backdrop-filter: blur(7.550000190734863px);
    border-radius: 8px;
    z-index: -2;
  }

  &:hover {
    background: ${(props) => props.theme.surfaceSecondary};

    &::after {
      background: ${(props) => props.theme.surfaceSecondary};
    }
  }
`;
