import { Text, BuyWithCashIcon, Box } from "~components/embed/ui";
import { Link } from "~wallets/router/components/link/Link";
import { useLocation } from "~wallets/router/router.utils";
import { DefaultCard } from "~components/embed/ui/molecules/card/default-card/DefaultCard";

import styles from "./receive.module.scss";

export function WalletReceiveOptionsEmbeddedView() {
  const { navigate } = useLocation();

  return (
    <DefaultCard
      headerText="Receive Tokens"
      subtitle="Where would you like to get your tokens from?"
      hasFooter
      onBackButtonClick={() => navigate("/wallet")}>
      <Link to="/wallet/buy/cash" className={styles.linkOption}>
        Cash
        <span style={{ display: "flex", margin: "-8px 0" }}>
          <BuyWithCashIcon />
        </span>
      </Link>

      <Link to="/wallet/deposit" className={styles.linkOption}>
        Receive from another wallet
      </Link>
    </DefaultCard>
  );
}
