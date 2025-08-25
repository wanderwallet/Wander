import React from "react";
import type { Alignments, Positions, Sizes } from "../../../types";

export type RowBaseProps = {
  children?: React.ReactNode;
  position?: Positions;
  alignment?: Alignments;
  className?: string;
  spacing?: Sizes;
  style?: React.CSSProperties;
  isOverlap?: boolean;
  wrap?: boolean;
  justifyContent?: "center" | "end" | "start" | "between" | "around" | "evenly";
  isFullWidth?: boolean;
  onClick?: () => void;
};
