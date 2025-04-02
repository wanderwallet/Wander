import copy from "copy-to-clipboard";
import { Card, Copyable, Button, WanderFooter } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function WalletDepositTokensEmbeddedView() {
  const { wallets } = useEmbedded();
  const { navigate } = useLocation();
  const walletAddress = wallets[0].address;
  return (
    <Card
      headerText={"Deposit Tokens"}
      subtitle="Paste this address to send tokens to your account."
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate("/wallet/receive/options")}
      size="auto"
    >
      <br />
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
      >
        Done
      </Button>
    </Card>
  );
}
