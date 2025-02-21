import React from "react";
import { Alignments, Positions } from "../../../types";

export type BoxBaseProps = {
  children?: React.ReactNode;
  position?: Positions;
  hasBorder?: boolean;
  alignment?: Alignments;
  className?: string;
  style?: React.CSSProperties;
  isBlurry?: boolean;
  isAutoWidth?: boolean;
};
