import { Section } from "@arconnect/components-rebrand";
import styled from "styled-components";
import type { Tier } from "~utils/tier/types";

const tierBackgrounds = {
  Core: "linear-gradient(0deg, #2B263B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
  Select: "linear-gradient(0deg, #26373B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
  Plus: "linear-gradient(0deg, #14291B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
  Prime: "linear-gradient(0deg, #343636 5.89%, rgba(17, 17, 17, 0.00) 100%)",
  Elite: "linear-gradient(0deg, #2D291B 5.89%, rgba(17, 17, 17, 0.00) 100%)",
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
  background: ${(props) => tierBackgrounds[props.tier]};
  box-sizing: border-box;
`;
