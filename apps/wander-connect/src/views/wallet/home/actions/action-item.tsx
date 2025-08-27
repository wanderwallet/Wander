import { WanderRoutePath } from "@wanderapp/core";
import { Text, Button } from "@wanderapp/ui";

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
