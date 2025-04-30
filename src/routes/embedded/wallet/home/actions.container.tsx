import {
  Row,
  CoinsIcon,
  Text,
  ReceiptIcon,
  OpenTabIcon,
  XClose,
  Box
} from "~components/embed/ui";
import browser from "~iframe/browser";
import { signOut } from "~utils/embedded/embedded.utils";
import { Link } from "~wallets/router/components/link/Link";

export function WalletHomeActions() {
  return (
    <Box alignment="left" style={{ marginLeft: "20px" }}>
      <br />
      <Link
        to="/wallet/receive/options"
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
          <ReceiptIcon color="#121212" />
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            Transaction history
          </Text>
        </Row>
      </Link>

      <br />

      <button
        onClick={signOut}
        style={{ textDecoration: "none", width: "100%" }}
      >
        <Row
          alignment="center"
          justifyContent="start"
          style={{
            cursor: "pointer"
          }}
        >
          <XClose color="#121212" />
          <Text variant="bodyMd" style={{ color: "#121212" }}>
            {browser.i18n.getMessage("sign_out")}
          </Text>
        </Row>
      </button>

      <br />

      {/* <Link
        to="/wallet/settings"
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
      </Link> */}
    </Box>
  );
}
