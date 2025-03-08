import { type HTMLProps, useMemo } from "react";
import styled from "styled-components";
import { formatAddress } from "~utils/format";
import type { StoredWallet } from "~wallets";
import HardwareWalletIcon from "~components/hardware/HardwareWalletIcon";
import keystoneLogo from "url:/assets/hardware/keystone.png";
import { svgie } from "~utils/svgies";
import { ListItem, ListItemIcon, Text } from "@arconnect/components-rebrand";
import Online from "~components/Online";

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

  const svgieAvatar = useMemo(
    () => svgie(address, { asDataURI: true }),
    [address]
  );

  return (
    <ListItem
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {name}
          {activeWallet && <Online />}
        </div>
      }
      subtitle={formattedAddress}
      active={active}
      img={avatar || svgieAvatar}
      squircleSize={40}
      height={56}
      showArrow
      {...props}
    >
      {!avatar && !svgieAvatar && (
        <ListItemIcon>
          <Text
            size="lg"
            weight="medium"
            noMargin
            style={{ textAlign: "center" }}
          >
            {wallet?.nickname?.charAt(0)?.toUpperCase() || "A"}
          </Text>
        </ListItemIcon>
      )}
      {wallet.type === "hardware" && wallet.api === "keystone" && (
        <HardwareIcon icon={keystoneLogo} color="#2161FF" />
      )}
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
