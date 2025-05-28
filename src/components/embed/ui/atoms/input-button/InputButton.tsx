import clsx from "clsx";
import type React from "react";
import { Button } from "~components/embed";
import type { ButtonType } from "~components/embed/ui/atoms/button/Button.types";

import styles from "./InputButton.module.scss";

export interface InputButtonProps {
  variant?: "primary" | "icon";
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
  className: classNameProp,
  label,
  icon,
  disabled,
  loading,
  ...props
}: InputButtonProps) {
  const variant = variantProp ?? (icon && !label ? "icon" : "primary");

  const className = clsx(
    styles["button"],
    {
      [styles.variantPrimary]: variant === "primary",
      [styles.variantIcon]: variant === "icon",
      [styles.onlyIcon]: icon && !label,
    },
    classNameProp,
  );

  return (
    <Button {...props} variant={variant} className={className} isDisabled={disabled} isLoading={loading}>
      {icon}
      {label}
    </Button>
  );
}
