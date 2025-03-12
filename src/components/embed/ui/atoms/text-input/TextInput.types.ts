import React from "react";

export type TextInputBaseProps = {
  placeholder: string;
  hasButton?: boolean;
  buttonLabel?: string;
  isSecure?: boolean;
  buttonOnClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
};
