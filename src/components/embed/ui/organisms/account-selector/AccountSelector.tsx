import copy from "copy-to-clipboard";
import { Avatar, Copyable, DownloadIcon, Row, Text, WalletIcon } from "~components/embed/ui";
import Dropdown from "~components/embed/ui/molecules/dropdown/Dropdown/Dropdown";
import DropdownItem from "~components/embed/ui/molecules/dropdown/DropdownItem/DropdownItem";
import type { Wallet } from "~utils/embedded/embedded.types";

import type { LocalWallet, StoredWallet } from "~wallets";
import type { HardwareWallet } from "~wallets/hardware";
import { setActiveWallet } from "~wallets/hooks";
import { Link } from "~wallets/router/components/link/Link";

export function AccountSelector({
  wallets,
  activeWallet,
}: {
  wallets?: StoredWallet[];
  activeWallet:
    | HardwareWallet
    | LocalWallet<string>
    | {
        address: string;
        nickname: string;
        type: string;
      };
}) {
  const handleAccountClick = async (wallet: Wallet) => {
    return await setActiveWallet(wallet.address);
  };

  return (
    <div style={{ alignSelf: "flex-start" }}>
      <Dropdown
        backupReminder={
          <Link to="/account/backup-wallet" style={{ textDecoration: "none", width: "100%" }}>
            <Row
              alignment="center"
              justifyContent="center"
              isFullWidth
              style={{
                padding: "8px 16px",
              }}>
              <Text variant="bodySm" style={{ fontWeight: 500 }}>
                Secure your account by backing it up.
              </Text>
              <DownloadIcon />
            </Row>
          </Link>
        }
        buttonAvatar={
          <Avatar fontColor={"#FFF"}>
            <WalletIcon color="#FFF" style={{ height: 16, width: 16 }} />
          </Avatar>
        }
        buttonText={
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            {activeWallet.nickname ?? activeWallet.address}
          </Text>
        }
        content={
          <>
            {wallets.map((wallet, id) => (
              <DropdownItem key={id} onClick={handleAccountClick}>
                <Row key={wallet.address} alignment="center" justifyContent="start" style={{ padding: "8px 16px" }}>
                  <Avatar fontColor={"#FFF"}>
                    <WalletIcon color="#FFF" style={{ height: 16, width: 16 }} />
                  </Avatar>
                  <Text
                    variant="bodyMd"
                    style={{
                      fontWeight: 500,
                      color: "#121212",
                      width: "max-content",
                    }}>
                    {wallet.nickname ?? wallet.address}
                  </Text>
                  <Copyable
                    isButtonOnly
                    hasBorder={false}
                    value={wallet.address}
                    style={{
                      maxWidth: 140,
                    }}
                    onClick={() => {
                      copy(wallet.address);
                    }}
                  />
                </Row>
              </DropdownItem>
            ))}
          </>
        }
      />
    </div>
  );
}
