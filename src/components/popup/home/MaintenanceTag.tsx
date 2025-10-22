// import { TierTypes } from "~utils/tier/constants";
// import { WanderIcon } from "./WanderIcon";
import styled, { useTheme } from "styled-components";
import { InfoCircle, InfoHexagon } from "@untitled-ui/icons-react";
import { InfoIcon } from "~components/embed";
import { Tooltip } from "@arconnect/components-rebrand";

interface MaintenanceTagProps {
  onClick: () => void;
}

export function MaintenanceTag({ onClick }: MaintenanceTagProps) {
  const theme = useTheme();

  return (
    <Tooltip content="Paused. Tokens migrating to AO mainnet" position="left">
      <Wrapper onClick={onClick}>
        <InfoIcon height={16} width={16} color={theme.displayTheme === "light" ? "#111" : "#EEE"} />
      </Wrapper>
    </Tooltip>
  );
}

const Wrapper = styled.div`
  display: flex;
  width: 24px;
  height: 24px;
  padding: 4.4px;
  justify-content: space-between;
  align-items: center;
  gap: 4.4px;
  flex-shrink: 0;
  border-radius: 8.8px;
  border: 1.1px solid ${({ theme }) => (theme.displayTheme === "light" ? "#87a38c" : "#87a38c")};
  background: ${({ theme }) =>
    theme.displayTheme === "light"
      ? "linear-gradient(180deg, #E6E0F4 0%, #F5F5F5 23.74%)"
      : "linear-gradient(180deg, #26126f 0%, #111 23.74%)"};
  cursor: pointer;
  box-shadow: ${({ theme }) =>
    theme.displayTheme === "light"
      ? `
      inset 0 1.1px 5.5px rgba(134, 229, 169, 0.3),
      inset 0 1.1px 1.98px rgba(0, 0, 0, 0.1),
      inset 0 63.23px 50.58px rgba(134, 229, 169, 0.03),
      inset 0 2.87px 12.93px rgba(8, 59, 88, 0.1),
      inset 0 0.72px 14.37px rgba(90, 93, 94, 0.1)
    `
      : `
      inset 0 1.1px 5.5px rgba(134, 229, 169, 0.6),
      inset 0 1.1px 1.98px rgba(255, 255, 255, 0.6),
      inset 0 63.23px 50.58px rgba(134, 229, 169, 0.03),
      inset 0 2.87px 12.93px rgba(8, 59, 88, 0.3),
      inset 0 0.72px 14.37px rgba(90, 93, 94, 0.2)
    `};
  backdrop-filter: blur(8.3px);
  box-sizing: border-box;

  &:hover {
    opacity: 0.8;
  }
`;
