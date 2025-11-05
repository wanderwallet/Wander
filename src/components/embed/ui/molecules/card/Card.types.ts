import React from "react";
import type { TextVariants } from "~components/embed/types";

export interface CardBaseProps {
  headerTextVariant?: TextVariants;
  headerText?: string;
  headerIcon?: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footerElement?: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  hasBackButton?: boolean;
  hasCloseButton?: boolean;
  onBackButtonClick?: () => void;
  onCloseButtonClick?: () => void;
  customIcon?: React.ReactNode;
  style?: React.CSSProperties;
  withExtraPadding?: boolean;
}
