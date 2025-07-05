import { type Tier } from "~utils/tier/types";
import { TierTypes } from "~utils/tier/constants";
import { useTheme } from "styled-components";
import { useId } from "react";

interface WanderIconProps {
  tier: Tier;
  height?: number;
  width?: number;
}

const colors = {
  dark: {
    [TierTypes.Prime]: { stopColor: "white", stopColorOffsetOne: "white", stopColorOffsetTwo: "#FFDB97" },
    [TierTypes.Edge]: { stopColor: "white", stopColorOffsetOne: "#CCCCCC", stopColorOffsetTwo: "#5E5E5E" },
    [TierTypes.Reserve]: { stopColor: "white", stopColorOffsetOne: "white", stopColorOffsetTwo: "#89CBBB" },
    [TierTypes.Select]: { stopColor: "white", stopColorOffsetOne: "white", stopColorOffsetTwo: "#89B3CB" },
    [TierTypes.Core]: { stopColor: "white", stopColorOffsetOne: "white", stopColorOffsetTwo: "#C3A1FF" },
  },
  light: {
    [TierTypes.Prime]: { stopColor: "#FFF4DE", stopColorOffsetOne: "#D5AA0F", stopColorOffsetTwo: "#FFDB97" },
    [TierTypes.Edge]: { stopColor: "#ECE9E9", stopColorOffsetOne: "#676666", stopColorOffsetTwo: "#D0CECE" },
    [TierTypes.Reserve]: { stopColor: "#007229", stopColorOffsetOne: "#89CBBB", stopColorOffsetTwo: "#89CBBB" },
    [TierTypes.Select]: { stopColor: "#074150", stopColorOffsetOne: "#89B3CB", stopColorOffsetTwo: "#89B3CB" },
    [TierTypes.Core]: { stopColor: "#26126F", stopColorOffsetOne: "#26126F", stopColorOffsetTwo: "#6B57F9" },
  },
};

export function WanderIcon({ tier, height = 10, width = 21 }: WanderIconProps) {
  const theme = useTheme();
  const { stopColor, stopColorOffsetOne, stopColorOffsetTwo } =
    colors[theme.displayTheme][tier] || colors[theme.displayTheme][TierTypes.Core];
  const gradientId = useId();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      style={{ flexShrink: 0 }}
      viewBox="0 0 21 10"
      fill="none">
      <path
        d="M0.519003 1.93839C0.441114 1.76866 0.626696 1.59911 0.788534 1.6923L6.21822 4.81242L9.74752 8.788L4.14986 9.68644L0.519003 1.93839ZM20.2114 1.6923C20.3732 1.59911 20.5598 1.76866 20.4819 1.93839L16.851 9.68644L11.2534 8.788L14.7827 4.81242L20.2114 1.6923ZM10.2817 0.456948C10.4433 0.247362 10.5912 0.279265 10.7417 0.474526L14.3139 5.0048L10.8393 8.12785L10.5024 0.955972L10.1665 8.12785L6.70357 4.99699L10.2817 0.456948Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient
          id={gradientId}
          x1="19.0815"
          y1="-1.03549"
          x2="0.500992"
          y2="10.7866"
          gradientUnits="userSpaceOnUse">
          <stop stopColor={stopColor} />
          <stop offset="0.3" stopColor={stopColorOffsetOne} />
          <stop offset="1" stopColor={stopColorOffsetTwo} />
        </linearGradient>
      </defs>
    </svg>
  );
}
