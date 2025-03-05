import {
  Card,
  Row,
  WanderIcon,
  Text,
  Button,
  Copyable
} from "~components/embed/ui";
import { useEmbedded } from "~utils/embedded/embedded.hooks";

export function AccountEmbeddedView() {
  const { wallets } = useEmbedded();

  const { address } = wallets[0];

  return (
    <Card
      headerText={"Account"}
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
      onBackButtonClick={() => {
        window.history.back();
      }}
      //   hasCloseButton={false}
      size="auto"
    >
      <Copyable
        style={{ margin: "32px 0" }}
        isFullWidth
        label="Your account address"
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(address, null, 2));
        }}
        value={JSON.stringify(address, null, 2)}
      />
      <Button isFullWidth size="md" href="/">
        Home
      </Button>
      <Button isFullWidth size="md" href="/account/add-wallet">
        Add Wallet
      </Button>
      <Button isFullWidth size="md" href="/account/backup-shares">
        Backup Shares
      </Button>
      <Button isFullWidth size="md" href="/account/export-wallet">
        Export Wallet
      </Button>
    </Card>
  );
}
