import React from "react";
import type { Sizes } from "../../../types";

export type CopyableBaseProps = {
  label?: string;
  value: string;
  className?: string;
  size?: Sizes;
  isFullWidth?: boolean;
  isDisabled?: boolean;
  isBlurry?: boolean;
  isLoading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  testId?: string;
  accessibilityLabel?: string;
  style?: React.CSSProperties;
  isShortened?: boolean;
  hasBorder?: boolean;
  isButtonOnly?: boolean;
  buttonText?: string;
};
