import React from "react";
import { Alignments, Positions } from "../../../types";

export type SeedInputBaseProps = {
  size?: 12 | 18 | 24;
  className?: string;
  style?: React.CSSProperties;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleCopyToClipboard: () => void;
  handleInputChange: (index: number, value: string) => void;
};
