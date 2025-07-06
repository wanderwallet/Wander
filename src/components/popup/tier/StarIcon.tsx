import type { Tier } from "~utils/tier/types";

interface StarIconProps {
  tier: Tier;
}

const colors = {
  Core: "#6B57F9",
  Select: "#284956",
  Reserve: "#6EE098",
  Edge: "#D4D4D4",
  Prime: "#C89A3F",
};

export const StarIcon = ({ tier }: StarIconProps) => {
  const color = colors[tier] || colors.Core;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="14"
      viewBox="0 0 15 14"
      fill="none"
      style={{ flexShrink: 0, transform: "translateY(2px)" }}>
      <path
        d="M7.18056 0L8.64585 5.52003L14.1111 7L8.64585 8.47997L7.18056 14L5.71526 8.47997L0.25 7L5.71526 5.52003L7.18056 0Z"
        fill={color}
      />
    </svg>
  );
};
