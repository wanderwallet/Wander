import clsx from "clsx";
import type React from "react";
import { Button } from "~components/embed";
import type { ButtonType } from "~components/embed/ui/atoms/button/Button.types";

import styles from "./InputButton.module.scss";

export interface InputButtonProps {
  type?: ButtonType;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function InputButton({
  type,
  className,
  label,
  icon,
  onClick,
  disabled,
  loading,
}: InputButtonProps) {
  return (
    <Button
      type={ type }
      variant={icon ? "icon" : "primary"}
      className={clsx(styles["button"], icon ? styles["button__icon"] : styles["button__text"], className)}
      onClick={onClick}
      isDisabled={disabled}
      isLoading={loading}>
      {icon || label}
    </Button>
  );
}
