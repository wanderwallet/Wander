import React from "react";
import type { Sizes } from "../../../../../theme/types";

export type AvatarBaseProps = {
  children?: React.ReactNode;
  className?: string;
  backgroundColor?: string;
  fontColor?: string;
  size?: Sizes;
  isBlurry?: boolean;
};
