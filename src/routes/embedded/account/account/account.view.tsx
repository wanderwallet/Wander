import copy from "copy-to-clipboard";
import { Card, Button, Copyable, WanderFooter } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountEmbeddedView() {
  const { wallets } = useEmbedded();
  const { back } = useLocation();
  const { address } = wallets[0];

  return (
    <Card
      headerText={"Account"}
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={back}
      size="auto"
    >
      <Copyable
        style={{ margin: "32px 0" }}
        isFullWidth
        label="Your wallet address"
        onClick={() => {
          copy(address);
        }}
        value={address}
      />
      <Button isFullWidth size="md" href="/wallet">
        Home
      </Button>
      <Button isFullWidth size="md" href="#/account/add-wallet">
        Add Wallet
      </Button>
      <Button isFullWidth size="md" href="#/account/backup-shares">
        Backup Shares
      </Button>
      <Button isFullWidth size="md" href="#/account/export-wallet">
        Export Wallet
      </Button>
    </Card>
  );
}
