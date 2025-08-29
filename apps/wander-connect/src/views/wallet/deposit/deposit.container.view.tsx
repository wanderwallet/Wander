import copy from "copy-to-clipboard";
import { useActiveWallet, useLocation } from "@wanderapp/core";
import { Button, Copyable, DefaultCard } from "@wanderapp/ui";

export function WalletDepositTokensEmbeddedView() {
  const wallet = useActiveWallet();
  const { navigate } = useLocation();
  const walletAddress = wallet.address;

  return (
    <DefaultCard
      headerText="Deposit Tokens"
      subtitle="Paste this address to send tokens to your account."
      hasFooter
      onBackButtonClick={() => navigate("/wallet/receive/options")}>
      <Copyable
        isFullWidth
        label="Your deposit address"
        value={walletAddress}
        onClick={() => {
          copy(walletAddress);
        }}
      />

      <Button
        isFullWidth
        size="md"
        onClick={() => navigate("/wallet/receive/options")}
        style={{ marginTop: " var(--spacing-3)" }}>
        Done
      </Button>
    </DefaultCard>
  );
}
