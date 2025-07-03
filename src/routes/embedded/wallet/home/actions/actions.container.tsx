import { CoinsIcon, ReceiptIcon, XClose, Box } from "~components/embed/ui";
import browser from "~iframe/browser";
import { ActionItem } from "~routes/embedded/wallet/home/actions/action-item";
import { signOut } from "~utils/embedded/embedded.utils";
import { Lock01 } from "@untitled-ui/icons-react";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

export function WalletHomeActions() {
  const { user } = useEmbedded();

  return (
    <Box style={{ padding: 0 }}>
      <ActionItem label="Receive tokens" icon={CoinsIcon} to="/wallet/receive/options" />

      <ActionItem label="Transaction history" icon={ReceiptIcon} to="/wallet/transactions" />

      <ActionItem
        label={browser.i18n.getMessage(user.user_metadata.hasPassword ? "change_password" : "set_password")}
        icon={Lock01}
        to="/account/change-password"
      />

      <ActionItem label={browser.i18n.getMessage("sign_out")} icon={XClose} onClick={() => signOut()} />

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
