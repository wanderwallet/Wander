import clsx from "clsx";
import type React from "react";
import { Button } from "~components/embed";
import type { ButtonType } from "~components/embed/ui/atoms/button/Button.types";

import styles from "./InputButton.module.scss";

export interface InputButtonProps {
  variant?: "primary" | "icon",
  type?: ButtonType;
  className?: string;
  label?: string;
  tabIndex?: number;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function InputButton({
  variant: variantProp,
  type,
  className: classNameProp,
  label,
  tabIndex,
  icon,
  onClick,
  disabled,
  loading,
}: InputButtonProps) {
  const variant = variantProp ?? (icon && !label ? "icon" : "primary");

  const className = clsx(styles["button"], {
    [styles.variantPrimary]: variant === "primary",
    [styles.variantIcon]: variant === "icon",
    [styles.onlyIcon]: icon && !label,
  }, classNameProp);

  return (
    <Button
      type={ type }
      variant={variant}
      className={className}
      tabIndex={tabIndex}
      onClick={onClick}
      isDisabled={disabled}
      isLoading={loading}>
      { icon }
      { label }
    </Button>
  );
}
