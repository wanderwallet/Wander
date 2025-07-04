import { Section } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { Tier } from "~utils/tier/types";

const tierBackgrounds = {
  dark: {
    Core: "linear-gradient(0deg, #2B263B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
    Select: "linear-gradient(0deg, #26373B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
    Plus: "linear-gradient(0deg, #14291B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
    Prime: "linear-gradient(0deg, #343636 5.89%, rgba(17, 17, 17, 0.00) 100%)",
    Elite: "linear-gradient(0deg, #2D291B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
  },
  light: {
    Core: "linear-gradient(0deg, #F2EEFF 5.89%, rgba(255, 255, 255, 0.00) 100%)",
    Select: "linear-gradient(0deg, #F1FAFD 5.89%, rgba(255, 255, 255, 0.00) 100%);",
    Plus: "linear-gradient(0deg, #F2FFF6 5.89%, rgba(255, 255, 255, 0.00) 100%);",
    Prime: "linear-gradient(0deg, #F0F0F0 5.89%, rgba(255, 255, 255, 0.00) 100%);",
    Elite: "linear-gradient(0deg, #FFFAEC 5.89%, rgba(255, 255, 255, 0.00) 100%);",
  },
};

export const TierWrapper = styled(Section)<{ tier: Tier }>`
  height: calc(100vh - 78px);
  padding-top: 0px;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow-y: auto;
  gap: 16px;
  flex: 1;
  background: ${(props) => tierBackgrounds[props.theme.displayTheme][props.tier]};
  box-sizing: border-box;
`;
