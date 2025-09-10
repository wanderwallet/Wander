import { CloseIcon } from "@iconicicons/react";
import styled from "styled-components";

export const ExitButton = styled(CloseIcon)<{ color?: string }>`
  cursor: pointer;
  color: ${({ theme, color }) => color || `${theme.displayTheme === "light" ? "#000000" : "#FFFFFF"}`};
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.15);
  }

  & path {
    stroke-width: 2;
  }

  /* Prevent rendering artifacts on hover */
  &:hover {
    transform-origin: center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
`;
