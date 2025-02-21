import React from "react";
import { Sizes } from "../../../types";

export type UploadBaseProps = {
  title?: string;
  description?: string;
  loadingText?: string;
  className?: string;
  isFullWidth?: boolean;
  isDisabled?: boolean;
  isBlurry?: boolean;
  isLoading?: boolean;
  testId?: string;
  accessibilityLabel?: string;
};
