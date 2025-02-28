import React from "react";
import { Alignments, TextVariants } from "../../../types";

export type TextBaseProps = {
  children?: React.ReactNode;
  alignment?: Alignments;
  style?: React.CSSProperties;
  variant?: TextVariants;
  className?: string;
};
