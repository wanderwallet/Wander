import { Row, Button, Text } from "~components/embed";
import type { WanderRoutePath } from "~wallets/router/router.types";

export interface ActionItemProps {
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  to?: WanderRoutePath;
  onClick?: () => void;
}

export function ActionItem({
  label,
  icon: Icon,
  to,
  onClick,
}: ActionItemProps) {
  return (
    <Button isFullWidth href={ to } onClick={ onClick } variant="icon">
      <Row
        alignment="center"
        justifyContent="start"
        style={{
          cursor: "pointer",
          padding: "var(--spacing-2) 0",
        }}>
        <Icon style={{ color: "var(--color-font-body)" }} />
        <Text variant="bodyMd">{ label }</Text>
      </Row>
      </Button>
  );
}
