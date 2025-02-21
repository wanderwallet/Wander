import React from "react";

export type CheckboxBaseProps = {
  label: string;
  id?: string;
  description?: string;
  className?: string;
  style?: React.CSSProperties;
  isDisabled?: boolean;
  isRequired?: boolean;
  isChecked?: boolean;
  isBlurry?: boolean;
  hasBorder?: boolean;
  handleChange: (e: React.MouseEvent<HTMLInputElement>) => void;
};
