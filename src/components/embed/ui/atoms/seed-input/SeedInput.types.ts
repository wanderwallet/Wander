import React from "react";

export type SeedInputBaseProps = {
  size?: 12 | 18 | 24;
  className?: string;
  style?: React.CSSProperties;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleCopyToClipboard: (value: string) => void;
  handleInputChange: (index: number, value: string) => void;
  seedPhrase: string[];
};
