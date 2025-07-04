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
    Plus: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#10291d",
      hoverBackground: "#143323",
      activeBackground: "#0c1f17",
    },
    Prime: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#242424",
      hoverBackground: "#2f2f2f",
      activeBackground: "#1a1a1a",
    },
    Elite: {
      border: "#ffeac2",
      background: "#26241b",
      hoverBackground: "#2f2c21",
      activeBackground: "#1e1c15",
    },
  },
  light: {
    Core: {
      border: "rgba(17, 17, 17, 0.20)",
      background: "linear-gradient(47deg, #5842F8 5.41%, #6B57F9 96%)",
      hoverBackground: "#503ECE",
      activeBackground: "#503ECE",
    },
    Select: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#26373B",
      hoverBackground: "#32494E",
      activeBackground: "#32494E",
    },
    Plus: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#10291D",
      hoverBackground: "#1A3A2A",
      activeBackground: "#1A3A2A",
    },
    Prime: {
      border: "rgba(255, 255, 255, 0.2)",
      background: "#242424",
      hoverBackground: "#2E2E2E",
      activeBackground: "#2E2E2E",
    },
    Elite: {
      border: "#ffeac2",
      background: "#26241B",
      hoverBackground: "#2F2C22",
      activeBackground: "#2F2C22",
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
