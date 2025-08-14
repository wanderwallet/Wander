import { Row, Button, Text } from "~components/embed";
import type { WanderRoutePath } from "~wallets/router/router.types";

import styles from "./action-item.module.scss";

export interface ActionItemProps {
  label: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
  to?: WanderRoutePath;
  onClick?: () => void;
}

export function ActionItem({ label, icon: Icon, to, onClick }: ActionItemProps) {
  return (
    <Button className={styles.root} isFullWidth href={to} onClick={onClick} variant="invisible">
      <Icon style={{ color: "var(--color-font-body)" }} />
      <Text variant="bodyMd">{label}</Text>
    </Button>
  );
}
