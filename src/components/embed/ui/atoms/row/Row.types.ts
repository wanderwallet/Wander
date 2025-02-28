import React from "react";
import { Alignments, Positions } from "../../../types";

export type RowBaseProps = {
  children?: React.ReactNode;
  position?: Positions;
  alignment?: Alignments;
  className?: string;
  style?: React.CSSProperties;
  isOverlap?: boolean;
};
