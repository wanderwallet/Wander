import {
  Avatar,
  Box,
  Copyable,
  DownloadIcon,
  Row,
  Text
} from "~components/embed/ui";
import Dropdown from "~components/embed/ui/molecules/dropdown/Dropdown/Dropdown";
import DropdownItem from "~components/embed/ui/molecules/dropdown/DropdownItem/DropdownItem";

import type { LocalWallet, StoredWallet } from "~wallets";
import type { HardwareWallet } from "~wallets/hardware";
import { Link } from "~wallets/router/components/link/Link";

export function AccountSelector({
  wallets,
  activeWallet
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
  return (
    <Box alignment="left">
      <Dropdown
        backupReminder={
          <Link
            to="/account/backup-shares"
            style={{ textDecoration: "none", width: "100%" }}
          >
            <Row
              alignment="center"
              justifyContent="center"
              isFullWidth
              style={{ backgroundColor: "#E7F0FD", padding: "8px 16px" }}
            >
              <Text variant="bodySm" style={{ fontWeight: 500 }}>
                Secure your account by backing it up.
              </Text>
              <DownloadIcon />
            </Row>
          </Link>
        }
        buttonAvatar={
          <Avatar fontColor={"#FFF"}>{activeWallet.nickname}</Avatar>
        }
        buttonText={activeWallet.nickname ?? activeWallet.address}
        content={
          <>
            {wallets.map((wallet, id) => (
              <DropdownItem key={id} onClick={() => console.log("clicked")}>
                <Row
                  key={wallet.address}
                  alignment="center"
                  justifyContent="start"
                  style={{ padding: "8px 16px" }}
                >
                  <Avatar fontColor={"#FFF"}>{wallet.nickname}</Avatar>
                  <Text
                    variant="bodyMd"
                    style={{
                      fontWeight: 500,
                      color: "#121212",
                      width: 140
                    }}
                  >
                    {wallet.nickname ?? wallet.address}
                  </Text>
                  <Copyable
                    hasBorder={false}
                    isFullWidth
                    value={wallet.address}
                    style={{
                      marginBottom: -16,
                      marginTop: -16
                    }}
                  />
                </Row>
              </DropdownItem>
            ))}
          </>
        }
      />
    </Box>
  );
}
