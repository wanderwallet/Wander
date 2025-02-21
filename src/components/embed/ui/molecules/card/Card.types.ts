import React from "react";
import { Sizes } from "../../../types";

export interface CardBaseProps {
  headerText?: string;
  headerIcon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footerElement?: React.ReactNode;
  className?: string;
  hasShadow?: boolean;
  isBlurry?: boolean;
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  onBackButtonClick?: () => void;
  onCloseButtonClick?: () => void;
  setShowPopover?: () => void;
  size?: Sizes;
  customIcon?: React.ReactNode;
}
