import type { WanderRoutePath } from "~wallets/router/router.types";
import { Link } from "~wallets/router/components/link/Link";
import { DevSpinner } from "~components/dev/spinner/spinner.component";

import styles from "./button.module.scss";
import React, { useMemo } from "react";
import { useLocation } from "~wallets/router/router.utils";

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
  onClick: onClickProp,
  variant = "primary",
  isLoading,
  isDisabled,
}: DevButtonProps) {
  const { navigate } = useLocation();

  const onClick = useMemo(() => {
    if (to && onClickProp) {
      return async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();

        await onClickProp(e);

        navigate(to);
      };
    }

    return onClickProp;
  }, [to, onClickProp]);

  const buttonElement = (
    <button className={`${styles.root} ${styles[variant]}`} onClick={onClick} disabled={isDisabled || isLoading}>
      {isLoading ? <DevSpinner /> : label}
    </button>
  );

  return to ? <Link to={to}>{buttonElement}</Link> : buttonElement;
}
