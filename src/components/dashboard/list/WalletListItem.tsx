import { type HTMLProps, useMemo } from "react";
import styled from "styled-components";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import HardwareWalletIcon from "~components/hardware/HardwareWalletIcon";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import { ListItem, ListItemIcon, Text } from "@wanderapp/components";
import Online from "~components/Online";
import { NoAvatarIcon } from "~components/Avatar";

export default function WalletListItem({
  wallet,
  name,
  address,
  avatar,
  active,
  activeWallet,
  ...props
}: Props & HTMLProps<HTMLDivElement>) {
  // format address
  const formattedAddress = useMemo(() => formatAddress(address, 8), [address]);

  return (
    <ListItem
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <WalletName>{name}</WalletName>
          {activeWallet && <Online />}
        </div>
      }
      subtitle={formattedAddress}
      active={active}
      img={avatar}
      squircleSize={40}
      height={56}
      showArrow
      {...props}>
      {!avatar && (
        <ListItemIcon>
          <NoAvatarIcon size="1.8em" />
        </ListItemIcon>
      )}
      {wallet.type === "hardware" && wallet.api === "keystone" && <HardwareIcon icon={keystoneLogo} color="#2161FF" />}
    </ListItem>
  );
}

interface Props {
  wallet: StoredWallet;
  avatar?: string;
  name: string;
  address: string;
  active: boolean;
  small?: boolean;
  activeWallet?: boolean;
}

const HardwareIcon = styled(HardwareWalletIcon)`
  position: absolute;
  width: 24px;
  height: 24px;
  right: -5px;
  bottom: -5px;
`;

export const WalletName = styled(Text).attrs({
  size: "lg",
  weight: "semibold",
  noMargin: true,
})`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 200px;
`;
