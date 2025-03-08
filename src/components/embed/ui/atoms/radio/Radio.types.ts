import React from "react";

export type RadioBaseProps = {
  label: string;
  id?: string;
  className?: string;
  isDisabled?: boolean;
  isRequired?: boolean;
  isChecked?: boolean;
  isBlurry?: boolean;
  handleChange: (e: React.MouseEvent<HTMLInputElement>) => void;
  style?: React.CSSProperties;
};
