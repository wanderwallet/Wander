import { type Tier } from "~utils/tier/types";
import { TierTypes } from "~utils/tier/constants";

interface WanderIconProps {
  tier: Tier;
  height?: number;
  width?: number;
}

const colors = {
  [TierTypes.Elite]: { stopColorOne: "#D5AA0F", stopColorTwo: "#F7D68D" },
  [TierTypes.Prime]: { stopColorOne: "#D5AA0F", stopColorTwo: "#F7D68D" },
  [TierTypes.Plus]: { stopColorOne: "#90A1A5", stopColorTwo: "#E6E6E6" },
  [TierTypes.Select]: { stopColorOne: "#C26C10", stopColorTwo: "#EDA355" },
  [TierTypes.Core]: { stopColorOne: "#838383", stopColorTwo: "#838383" },
};

export function WanderIcon({ tier, height = 10, width = 21 }: WanderIconProps) {
  const { stopColorOne, stopColorTwo } = colors[tier] || colors[TierTypes.Core];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
      width={width}
      height={height}
      viewBox="0 0 21 10"
      fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.3136 5.00474L10.7409 0.474544C10.5904 0.279227 10.4428 0.247329 10.2811 0.457111L6.70288 4.99737L10.1662 8.12758L10.5025 0.956044L10.8388 8.12758L14.3136 5.00474Z"
        fill="url(#paint0_linear_4_720)"
      />
      <path
        d="M16.8507 9.68666L20.4817 1.93816C20.5596 1.76843 20.3736 1.59883 20.2118 1.69201L14.7824 4.81263L11.2533 8.78827L16.8507 9.68666Z"
        fill="url(#paint1_linear_4_720)"
      />
      <path
        d="M4.1493 9.68666L0.518291 1.93816C0.440401 1.76843 0.62641 1.59883 0.788249 1.69201L6.21762 4.81263L9.7467 8.78827L4.1493 9.68666Z"
        fill="url(#paint2_linear_4_720)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_4_720"
          x1="10.4814"
          y1="8.12758"
          x2="10.4814"
          y2="0.313354"
          gradientUnits="userSpaceOnUse">
          <stop stopColor={stopColorOne} />
          <stop offset="1" stopColor={stopColorTwo} />
        </linearGradient>
        <linearGradient
          id="paint1_linear_4_720"
          x1="12.6975"
          y1="6.53399"
          x2="17.5727"
          y2="9.30331"
          gradientUnits="userSpaceOnUse">
          <stop stopColor={stopColorOne} />
          <stop offset="1" stopColor={stopColorTwo} />
        </linearGradient>
        <linearGradient
          id="paint2_linear_4_720"
          x1="8.30248"
          y1="6.53399"
          x2="3.42726"
          y2="9.30331"
          gradientUnits="userSpaceOnUse">
          <stop stopColor={stopColorOne} />
          <stop offset="1" stopColor={stopColorTwo} />
        </linearGradient>
      </defs>
    </svg>
  );
}
