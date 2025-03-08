import {
  DevButton,
  type DevButtonProps
} from "~components/dev/button/button.component";

import styles from "./buttons.module.scss";

export interface DevButtonsProps {
  config: DevButtonProps[];
  variant?: "primary" | "secondary" | "dev";
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function DevButtons({
  config,
  variant,
  isLoading,
  isDisabled
}: DevButtonsProps) {
  return (
    <ul className={styles.root}>
      {config.map((buttonConfig, i) => {
        return (
          <li key={i} className={styles.li}>
            <DevButton
              {...buttonConfig}
              variant={buttonConfig.variant || variant}
              isLoading={buttonConfig.isLoading || isLoading}
              isDisabled={buttonConfig.isDisabled || isDisabled}
            />
          </li>
        );
      })}
    </ul>
  );
}
