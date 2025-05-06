import React from "react";

export type TextInputBaseProps = React.InputHTMLAttributes<HTMLInputElement> & {
  placeholder: string;
  hasButton?: boolean;
  buttonLabel?: string;
  buttonIcon?: React.ReactNode;
  isDisabled?: boolean;
  isSecure?: boolean;
  buttonOnClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  isLoading?: boolean;
};
