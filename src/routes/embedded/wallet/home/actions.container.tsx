import { Row, CoinsIcon, Text, ReceiptIcon, OpenTabIcon, XClose, Box } from "~components/embed/ui";
import browser from "~iframe/browser";
import { signOut } from "~utils/embedded/embedded.utils";
import { Link } from "~wallets/router/components/link/Link";

export function WalletHomeActions() {
  return (
    <Box>
      <Link to="/wallet/receive/options" style={{ textDecoration: "none", width: "100%" }}>
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer",
            padding: "var(--spacing-2) 0",
          }}>
          <CoinsIcon style={{ color: "var(--color-font-body)" }} />
          <Text variant="bodyMd">Receive tokens</Text>
        </Row>
      </Link>

      <Link to="/wallet/transactions" style={{ textDecoration: "none", width: "100%" }}>
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer",
            padding: "var(--spacing-2) 0",
          }}>
          <ReceiptIcon style={{ color: "var(--color-font-body)" }} />
          <Text variant="bodyMd">Transaction history</Text>
        </Row>
      </Link>

      <button onClick={signOut} style={{ textDecoration: "none", width: "100%" }}>
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer",
            padding: "var(--spacing-2) 0",
          }}>
          <XClose style={{ color: "var(--color-font-body)", height: 20, width: 20 }} />
          <Text variant="bodyMd">{browser.i18n.getMessage("sign_out")}</Text>
        </Row>
      </button>

      {/* <Link
        to="/wallet/settings"
        style={{ textDecoration: "none", width: "100%" }}
      >
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer",
            padding: "var(--spacing-2) 0",
          }}
        >
          <OpenTabIcon style={{ color: "var(--color-font-body)" }} />
          <Text variant="bodyMd">
            View wallet dashboard
          </Text>
        </Row>
      </Link> */}
    </Box>
  );
}
