import styled from "styled-components";
import Squircle from "~components/Squircle";
import HardwareWalletIcon from "./hardware/HardwareWalletIcon";
import { WalletIcon } from "@iconicicons/react";

const avatarSize = "1.5rem";

export const Avatar = styled(Squircle)`
  position: relative;
  width: ${avatarSize};
  height: ${avatarSize};

  ${HardwareWalletIcon} {
    position: absolute;
    right: -5px;
    bottom: -5px;
  }
`;

export const NoAvatarIcon = styled(WalletIcon)<{ size?: string }>`
  position: absolute;
  font-size: 1rem;
  width: ${(props) => props.size || "1em"};
  height: ${(props) => props.size || "1em"};
  color: #fff;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;
