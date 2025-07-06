import { Button } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { Tier } from "~utils/tier/types";

const tierStyles = {
  dark: {
    Core: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#26273b",
      hoverBackground: "#2f3047",
      activeBackground: "#1e1f30",
    },
    Select: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#26373b",
      hoverBackground: "#2f414a",
      activeBackground: "#1e2d32",
    },
    Reserve: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#10291d",
      hoverBackground: "#143323",
      activeBackground: "#0c1f17",
    },
    Edge: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#242424",
      hoverBackground: "#2f2f2f",
      activeBackground: "#1a1a1a",
    },
    Prime: {
      border: "#ffeac2",
      background: "#26241b",
      hoverBackground: "#2f2c21",
      activeBackground: "#1e1c15",
    },
  },
  light: {
    Core: {
      border: "rgba(17, 17, 17, 0.20)",
      background: "#F9F8FF",
      hoverBackground: "#F0EEFF",
      activeBackground: "#E7E4FF",
    },
    Select: {
      border: "rgba(34, 134, 172, 0.20)",
      background: "#F8FDFF",
      hoverBackground: "#EFF9FC",
      activeBackground: "#E6F5F9",
    },
    Reserve: {
      border: "rgba(48, 171, 93, 0.20)",
      background: "#F8FFFA",
      hoverBackground: "#EFFBF3",
      activeBackground: "#E6F7EC",
    },
    Edge: {
      border: "rgba(153, 153, 153, 0.20)",
      background: "#F8F8F8",
      hoverBackground: "#EFEFEF",
      activeBackground: "#E6E6E6",
    },
    Prime: {
      border: "rgba(185, 149, 42, 0.20)",
      background: "#FFFEF7",
      hoverBackground: "#F6F5EE",
      activeBackground: "#EDECE5",
    },
  },
};

export const TierButton = styled(Button).attrs({ fullWidth: true })<{ tier: Tier }>`
  display: flex;
  height: 46px;
  padding: 24px;
  justify-content: center;
  align-items: center;
  gap: 4px;
  align-self: stretch;
  border-radius: 12px;
  color: ${({ theme }) => theme.primaryText};
  border: 1px solid ${(props) => tierStyles[props.theme.displayTheme][props.tier].border};
  background: ${(props) => tierStyles[props.theme.displayTheme][props.tier].background};

  &:hover {
    background: ${(props) => tierStyles[props.theme.displayTheme][props.tier].hoverBackground};
    border: 1px solid ${(props) => tierStyles[props.theme.displayTheme][props.tier].border};
  }

  &:active {
    background: ${(props) => tierStyles[props.theme.displayTheme][props.tier].activeBackground};
    border: 1px solid ${(props) => tierStyles[props.theme.displayTheme][props.tier].border};
  }
`;
