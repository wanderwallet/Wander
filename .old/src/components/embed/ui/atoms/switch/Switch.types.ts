import React from "react";

export type SwitchBaseProps = {
  isChecked?: boolean;
  isDisabled?: boolean;
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  id?: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  labelPosition?: "left" | "right";
  style?: React.CSSProperties;
  size?: number;
};
