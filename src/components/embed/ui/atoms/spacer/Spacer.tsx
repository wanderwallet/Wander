import React from "react";
import type { SpacerProps } from "./Spacer.types";

export const Spacer: React.FC<SpacerProps> = ({ x, y }) => {
  const style = {
    display: "block",
    height: y ? `${y}rem` : "0",
    width: x ? `${x}rem` : "0",
  };

  return <span style={style} />;
};
