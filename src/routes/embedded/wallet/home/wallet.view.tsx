import { useStorage } from "~utils/storage";
import { ExtensionStorage } from "~utils/storage";
import { useEffect, useState } from "react";
import { getDecryptionKey } from "~wallets/auth";
import {
  trackEvent,
  EventType,
  trackPage,
  PageType,
  checkWalletBits
} from "~utils/analytics";
import { useActiveWallet } from "~wallets/hooks";
import { scheduleImportAoTokens } from "~tokens/aoTokens/sync";
import {
  Card,
  Divider,
  AccountSelector,
  Row,
  CoinsIcon,
  Text,
  ReceiptIcon,
  OpenTabIcon,
  Box
} from "~components/embed/ui";
import { Link } from "~wallets/router/components/link/Link";
import Balance from "~components/popup/home/Balance";
import type { StoredWallet } from "~wallets";

export function WalletHomeEmbeddedView() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isOpen, setOpen] = useState(false);

  const [announcement, _] = useStorage<boolean>({
    key: "show_announcement",
    instance: ExtensionStorage
  });

  // checking to see if it's a hardware wallet
  const wallet = useActiveWallet();
  const [wallets] = useStorage<StoredWallet[]>(
    {
      key: "wallets",
      instance: ExtensionStorage
    },
    []
  );
  useEffect(() => {
    const trackEventAndPage = async () => {
      await trackEvent(EventType.LOGIN, {});
      await trackPage(PageType.HOME);
    };
    trackEventAndPage();

    // schedule import ao tokens
    scheduleImportAoTokens();
  }, []);

  useEffect(() => {
    const checkBits = async () => {
      if (!loggedIn) return;

      const bits = await checkWalletBits();
    };

    checkBits();
  }, [loggedIn]);

  useEffect(() => {
    // check whether to show announcement
    (async () => {
      // reset announcements if setting_notifications is uninitialized
      const decryptionKey = await getDecryptionKey();
      if (decryptionKey) {
        setLoggedIn(true);
      }

      // WALLET.TYPE JUST FOR KEYSTONE POPUP
      if (announcement && wallet?.type === "hardware") {
        setOpen(true);
      } else {
        setOpen(false);
      }
    })();
  }, [wallet, announcement]);

  return (
    <Card size="auto" style={{ padding: "32px" }} hasBackButton={false}>
      <AccountSelector wallets={wallets} activeWallet={wallet} />
      <Balance />
      <Divider />
      <Box alignment="left">
        <Link
          to="/wallet/receive"
          style={{ textDecoration: "none", width: "100%" }}
        >
          <Row
            alignment="center"
            justifyContent="start"
            style={{
              cursor: "pointer"
            }}
          >
            <CoinsIcon color="#121212" />
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              Receive tokens
            </Text>
          </Row>
        </Link>
        <br />
        <Link
          to="/wallet/transactions"
          style={{ textDecoration: "none", width: "100%" }}
        >
          <Row
            alignment="center"
            justifyContent="start"
            style={{
              cursor: "pointer"
            }}
          >
            <ReceiptIcon />
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              Transaction history
            </Text>
          </Row>
        </Link>
        <br />
        <Link
          to="/wallet/dashboard"
          style={{ textDecoration: "none", width: "100%" }}
        >
          <Row
            alignment="center"
            justifyContent="start"
            style={{
              cursor: "pointer"
            }}
          >
            <OpenTabIcon />
            <Text variant="bodyMd" style={{ color: "#121212" }}>
              View wallet dashboard
            </Text>
          </Row>
        </Link>
      </Box>
    </Card>
  );
}
