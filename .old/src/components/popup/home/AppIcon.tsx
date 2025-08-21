import { GlobeIcon } from "@iconicicons/react";
import Squircle from "~components/Squircle";
import styled from "styled-components";

export const NoAppIcon = styled(GlobeIcon)`
  font-size: 2rem;
  width: 1em;
  height: 1em;
  color: #fff;
`;

export const AppIcon = styled(Squircle)<{ color?: string }>`
  color: ${(props) => (props.color ? props.color : "rgb(" + props.theme.theme + ")")};
  width: 3rem;
  height: 3rem;
  cursor: pointer;

  img,
  ${NoAppIcon} {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    transition: all 0.23s ease-in-out;
  }

  img {
    max-width: 2.5em;
    user-select: none;
  }

  &:hover img,
  &:hover ${NoAppIcon} {
    opacity: 0.84;
  }
`;

export default AppIcon;
