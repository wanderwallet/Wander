import type { WanderRoutePath } from "~wallets/router/router.types";
import { Link } from "~wallets/router/components/link/Link";
import { DevSpinner } from "~components/dev/spinner/spinner.component";

import styles from "./button.module.scss";

export interface DevButtonProps {
  label: string;
  to?: WanderRoutePath;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "dev";
  isLoading?: boolean;
  isDisabled?: boolean;
}

export function DevButton({
  label,
  to,
  onClick,
  variant = "primary",
  isLoading,
  isDisabled
}: DevButtonProps) {
  // TODO: Throw an error if both `to` and `onClick` are set, or add code to handle that properly.

  const buttonElement = (
    <button
      className={`${styles.root} ${styles[variant]}`}
      onClick={onClick}
      disabled={isDisabled || isLoading}
    >
      {isLoading ? <DevSpinner /> : label}
    </button>
  );

  return to ? <Link to={to}>{buttonElement}</Link> : buttonElement;
}
