import { Button, Text, Row, Box, Avatar, WalletIcon } from "~components/embed/ui";
import type { Wallet } from "~utils/embedded/embedded.types";
import { formatAddress } from "~utils/format";
import { setActiveWallet, useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";
import { useEffect, useState } from "react";
import { concatGatewayURL } from "~gateways/utils";
import { useGateway, FULL_HISTORY } from "~gateways/wayfinder";
import { useNameServiceProfile } from "~lib/nameservice";
import { ExtensionStorage } from "~utils/storage";
import AppIcons from "./components/AppIcons";
import { useAllWallets } from "~wallets/hooks";
import { AuthRequestCard } from "~components/embed/ui/molecules/card/auth-request-card/AuthRequestCard";
import browser from "~iframe/browser";

export function EmbeddedConnectAuthRequestView() {
  const { navigate } = useLocation();
  const activeWallet = useActiveWallet();
  const wallets = useAllWallets();
  const { authRequest, rejectRequest } = useCurrentAuthRequest("connect");

  const [avatar, setAvatar] = useState("");

  const nameServiceProfile = useNameServiceProfile(activeWallet?.address);
  const nsGateway = useGateway(FULL_HISTORY);

  const { appInfo = {}, url = "" } = authRequest;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleWalletSelect = (wallet: Partial<Wallet>) => () => {
    if (wallet.address) {
      setIsDropdownOpen(false);
      setActiveWallet(wallet.address);
    }
  };

  useEffect(() => {
    if (!activeWallet?.address) return;

    if (nameServiceProfile?.logo && nsGateway?.protocol && nsGateway?.host) {
      setAvatar(concatGatewayURL(nsGateway) + "/" + nameServiceProfile.logo);
    }
  }, [activeWallet, nameServiceProfile, nsGateway]);

  const handleConfirm = () => {
    ExtensionStorage.remove(`requested_permissions`);
    ExtensionStorage.remove("sign_policy");
    navigate(`/auth-request/connect/${authRequest.authID}/settings`);
  };

  return (
    <>
      <AuthRequestCard
        onCancel={() => rejectRequest()}
        onConfirm={handleConfirm}
        confirmLabel={browser.i18n.getMessage("next")}>
        <AppIcons appInfo={appInfo} />

        <Text variant="headingMd" style={{ display: "block", width: "100%" }}>
          {appInfo.name} would like to connect to your wallet
        </Text>

        <Text variant="bodyMd" style={{ display: "block", width: "100%" }}>
          Select an account to connect:
        </Text>

        <Box
          alignment="left"
          style={{
            width: "100%",
            backgroundColor: "var(--input-background)",
            borderRadius: "16px",
            position: "relative",
          }}>
          <Row>
            <Row alignment="center" justifyContent="start" style={{ padding: 0, flex: 1 }}>
              <Avatar fontColor="#EBEBF0" backgroundColor="#0D6CE9" size="lg">
                <WalletIcon color="#FFF" />
              </Avatar>
              <Box isAutoWidth alignment="left" style={{ padding: 0 }}>
                <Text variant="bodyLg" style={{ color: "#121212" }}>
                  {activeWallet.nickname}
                </Text>
                <Text variant="bodySm">{formatAddress(activeWallet.address, 4)}</Text>
              </Box>
            </Row>
            <Button variant="link" style={{ paddingInline: "16px" }} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <Text alignment="right" variant="bodySm" style={{ color: "#0D6CE9" }}>
                Change
              </Text>
            </Button>
          </Row>
        </Box>
      </AuthRequestCard>

      {/* Add overlay when dropdown is open */}
      {isDropdownOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
          }}
          onClick={() => setIsDropdownOpen(false)}
        />
      )}

      {/* Modal for wallet selection */}
      {isDropdownOpen && (
        <Box
          alignment="left"
          style={{
            position: "fixed",
            top: "42%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "360px",
            zIndex: 1000,
            backgroundColor: "var(--color-background-default)",
            borderRadius: "16px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
            padding: "0",
            maxHeight: "70vh",
            overflowY: "auto",
          }}>
          {wallets.map((wallet, index) => (
            <div
              key={wallet.address}
              onClick={handleWalletSelect(wallet)}
              style={{
                cursor: "pointer",
                backgroundColor: wallet.address === activeWallet.address ? "var(--input-background)" : "transparent",
                margin: "0",
                padding: "0",
                transition: "background-color 0.2s ease",
                width: "100%",
              }}
              onMouseEnter={(e) => {
                if (wallet.address !== activeWallet.address) {
                  e.currentTarget.style.backgroundColor = "#F9F9FC";
                }
              }}
              onMouseLeave={(e) => {
                if (wallet.address !== activeWallet.address) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}>
              <Row alignment="center" justifyContent="start" style={{ paddingInline: "22px", marginTop: "4px" }}>
                <Avatar fontColor="#EBEBF0" backgroundColor="#0D6CE9" size="lg">
                  <WalletIcon color="#FFF" />
                </Avatar>
                <Box isAutoWidth alignment="left">
                  <Text variant="bodyLg" style={{ color: "#121212" }}>
                    {wallet.nickname}
                  </Text>
                  <Text variant="bodySm">{wallet.address ? formatAddress(wallet.address, 4) : ""}</Text>
                </Box>
              </Row>
            </div>
          ))}
        </Box>
      )}
    </>
  );
}
