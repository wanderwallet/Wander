import { CopyToClipboard } from "~components/CopyToClipboard";
import { Avatar, DownloadIcon, Row, Text, WalletIcon } from "~components/embed/ui";
import Dropdown from "~components/embed/ui/molecules/dropdown/Dropdown/Dropdown";
import DropdownItem from "~components/embed/ui/molecules/dropdown/DropdownItem/DropdownItem";
import type { StoredWallet } from "~wallets";
import { setActiveWallet } from "~wallets/hooks";
import { Link } from "~wallets/router/components/link/Link";

export interface AccountSelectorProps {
  wallets: StoredWallet[];
  currentWallet: StoredWallet;
}

export function AccountSelector({ wallets, currentWallet }: AccountSelectorProps) {
  const handleAccountClick = async (wallet: StoredWallet) => {
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
              <DownloadIcon style={{ flexShrink: 0 }} />
            </Row>
          </Link>
        }
        buttonAvatar={
          <Avatar fontColor={"#FFF"}>
            <WalletIcon color="#FFF" style={{ height: 16, width: 16 }} />
          </Avatar>
        }
        buttonText={
          <Text
            variant="bodyMd"
            style={{
              color: "#121212",
              maxWidth: "calc(100vw - 8 * 32px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}>
            {currentWallet ? currentWallet.nickname || currentWallet.address : null}
          </Text>
        }
        content={
          <>
            {wallets.map((wallet, id) => (
              <DropdownItem key={id} onClick={() => handleAccountClick(wallet)}>
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
                      maxWidth: "calc(100vw - 8 * 32px)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}>
                    {wallet.nickname ?? wallet.address}
                  </Text>
                  <CopyToClipboard text={wallet.address} />
                </Row>
              </DropdownItem>
            ))}
          </>
        }
      />
    </div>
  );
}
