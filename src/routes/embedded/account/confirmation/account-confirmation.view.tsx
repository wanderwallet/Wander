import copy from "copy-to-clipboard";
import { Card, Copyable, Button, WanderFooter } from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";

export function AccountConfirmationEmbeddedView() {
  const { wallets, lastRegisteredWallet, clearLastRegisteredWallet } =
    useEmbedded();
  const { navigate } = useLocation();

  return (
    <Card
      headerText={
        wallets.length === 1
          ? `Congratulations, your account\n has been created!`
          : `Congratulations, your wallet has been ${
              lastRegisteredWallet.source.type === "IMPORTED"
                ? "imported"
                : "created"
            }!`
      }
      footerElement={<WanderFooter />}
      hasBackButton={true}
      onBackButtonClick={() => navigate(`/auth`)}
      size="auto"
    >
      <br />
      <Copyable
        isFullWidth
        label="Your wallet address"
        value={lastRegisteredWallet.address}
        onClick={() => {
          copy(lastRegisteredWallet.address);
        }}
      />
      <Button isFullWidth size="md" onClick={() => clearLastRegisteredWallet()}>
        Done
      </Button>
    </Card>
  );
}
