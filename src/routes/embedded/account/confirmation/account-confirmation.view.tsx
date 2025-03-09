import copy from "copy-to-clipboard";
import {
  Card,
  Row,
  WanderIcon,
  Text,
  Box,
  Copyable,
  Button
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";
import { useLocation } from "~wallets/router/router.utils";
const shortenAddress = (address: string): string =>
  `${address.slice(0, 8)}...${address.slice(-6)}`;

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
              lastRegisteredWallet.source.type === "imported"
                ? "imported"
                : "created"
            }!`
      }
      subtitle="A confirmation email has been sent with recovery instructions."
      footerElement={
        <Row>
          <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
            {"Secured by"}
          </Text>
          <WanderIcon color="#838383" />
        </Row>
      }
      hasBackButton={true}
      onBackButtonClick={() => navigate(`/auth`)}
      size="auto"
    >
      <br />
      <Copyable
        isFullWidth
        label="Your wallet address"
        value={shortenAddress(lastRegisteredWallet.address)}
        tooltipValue={lastRegisteredWallet.address}
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
