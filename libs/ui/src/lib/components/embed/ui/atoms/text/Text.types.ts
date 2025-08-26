import React from "react";
import type { Alignments, TextVariants } from "../../../../../theme/types";

export type TextBaseProps = {
  children?: React.ReactNode;
  alignment?: Alignments;
  style?: React.CSSProperties;
  variant?: TextVariants;
  className?: string;
  onClick?: () => void;
};
