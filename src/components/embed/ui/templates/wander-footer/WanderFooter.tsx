import { Row, Text, WanderIcon } from "../../atoms";

function WanderFooter() {
  return (
    <Row style={{ gap: "4px", marginTop: "16px" }}>
      <Text variant={"bodyXs"} style={{ marginBottom: 0 }}>
        {"Secured by"}
      </Text>
      <WanderIcon color="#838383" />
    </Row>
  );
}

WanderFooter.displayName = "WanderFooter";

export { WanderFooter };
