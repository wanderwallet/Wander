import { Card, Button, Text, Row, Box, Avatar } from "~components/embed/ui";
import { useState } from "react";
import type { Wallet } from "~utils/embedded/embedded.types";
import { formatAddress } from "~utils/format";
import { setActiveWallet, useActiveWallet } from "~wallets/hooks";
import { useLocation } from "~wallets/router/router.utils";
import { postEmbeddedMessage } from "~utils/embedded/utils/messages/embedded-messages.utils";
import { useCurrentAuthRequest } from "~utils/auth/auth.hooks";

// Mock wallets for demo purposes
const mockWallets: Partial<Wallet>[] = [
  {
    address: "0x123456789abcdef",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  },
  {
    address: "0xabcdef123456789",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  },
  {
    address: "0x987654321fedcba",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  },
  {
    address: "0x456789abcdef123",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  },
  {
    address: "0xfedcba987654321",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  },
  {
    address: "0x13579acegi24680",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  },
  {
    address: "0x24680bdfhj13579",
    activationStatus: "active",
    deviceShare: null,
    authShare: null
  }
];

export function EmbeddedConnectAuthRequestView() {
  const { navigate } = useLocation();
  const wallet = useActiveWallet();
  const { authRequest } = useCurrentAuthRequest("connect");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleClick = async (selectedWallet: Partial<Wallet>) => {
    if (selectedWallet.address) {
      setIsDropdownOpen(false);
      return await setActiveWallet(selectedWallet.address);
    }
  };

  // Create encoded URL for href navigation
  const settingsUrl = (() => {
    const encodedPayload = encodeURIComponent(JSON.stringify(authRequest));
    return `#/wallet/settings?requestPayload=${encodedPayload}`;
  })();

  // Custom onClick handler for Box component
  const handleWalletSelect = (mockWallet: Partial<Wallet>) => () => {
    if (mockWallet.address) {
      handleClick(mockWallet);
    }
  };

  return (
    <>
      <Card
        size="auto"
        headerText={`${authRequest.appInfo.name} would like to connect to your wallet`}
        style={{
          paddingTop: "24px",
          paddingInline: "16px",
          paddingBottom: "24px"
        }}
        hasCloseButton={false}
      >
        <Box alignment="left">
          <Text variant="bodyMd">Select an account to connect:</Text>
          <Box
            alignment="left"
            style={{
              margin: "16px 0 24px 0",
              width: "100%",
              backgroundColor: "#EBEBF0",
              borderRadius: "16px",
              position: "relative"
            }}
          >
            <Row>
              <Row
                alignment="center"
                justifyContent="start"
                style={{ padding: "12px 8px", flex: 1 }}
              >
                <Avatar fontColor="#EBEBF0" backgroundColor="#0D6CE9" size="lg">
                  {wallet.nickname.charAt(0)}
                </Avatar>
                <Box isAutoWidth alignment="left">
                  <Text variant="bodyLg" style={{ color: "#121212" }}>
                    {wallet.nickname}
                  </Text>
                  <Text variant="bodySm">
                    {formatAddress(wallet.address, 4)}
                  </Text>
                </Box>
              </Row>
              <Button
                variant="link"
                style={{ paddingInline: "16px" }}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Text
                  alignment="right"
                  variant="bodySm"
                  style={{ color: "#0D6CE9" }}
                >
                  Change
                </Text>
              </Button>
            </Row>
          </Box>
          <Button variant="primary" isFullWidth href={settingsUrl}>
            Next
          </Button>
          <Button
            variant="secondary"
            isFullWidth
            onClick={() => {
              postEmbeddedMessage({
                type: "embedded_close",
                data: null
              });
            }}
          >
            Cancel
          </Button>
        </Box>
      </Card>

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
            zIndex: 999
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
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: "360px",
            zIndex: 1000,
            backgroundColor: "#FFFFFF",
            borderRadius: "16px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.15)",
            padding: "0",
            maxHeight: "70vh",
            overflowY: "auto"
          }}
        >
          {mockWallets.map((mockWallet, index) => (
            <div
              key={mockWallet.address}
              onClick={handleWalletSelect(mockWallet)}
              style={{
                cursor: "pointer",
                backgroundColor:
                  mockWallet.address === wallet.address
                    ? "#F5F5FA"
                    : "transparent",
                margin: "0",
                padding: "0",
                transition: "background-color 0.2s ease"
              }}
              onMouseEnter={(e) => {
                if (mockWallet.address !== wallet.address) {
                  e.currentTarget.style.backgroundColor = "#F9F9FC";
                }
              }}
              onMouseLeave={(e) => {
                if (mockWallet.address !== wallet.address) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Row
                alignment="center"
                justifyContent="start"
                style={{ paddingInline: "22px", marginTop: "4px" }}
              >
                <Avatar fontColor="#EBEBF0" backgroundColor="#0D6CE9" size="lg">
                  {mockWallet.address?.slice(0, 2).toUpperCase()}
                </Avatar>
                <Box isAutoWidth alignment="left">
                  <Text variant="bodyLg" style={{ color: "#121212" }}>
                    {`Account ${mockWallets.indexOf(mockWallet) + 1}`}
                  </Text>
                  <Text variant="bodySm">
                    {mockWallet.address
                      ? formatAddress(mockWallet.address, 4)
                      : ""}
                  </Text>
                </Box>
              </Row>
            </div>
          ))}
        </Box>
      )}
    </>
  );
}
