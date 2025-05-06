import React from "react";
import type { Sizes } from "../../../types";

export interface CardBaseProps {
  headerText?: string;
  headerIcon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footerElement?: React.ReactNode;
  className?: string;
  hasShadow?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  onBackButtonClick?: () => void;
  onCloseButtonClick?: () => void;
  setShowPopover?: () => void;
  size?: Sizes;
  customIcon?: React.ReactNode;
  style?: React.CSSProperties;
  closeButtonStyles?: React.CSSProperties;
}
