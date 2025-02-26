import React from "react";
import type { Sizes } from "../../../types";

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
  onFileChange?: (file: File) => void;
  textInputRef?: React.Ref<HTMLInputElement>;
};
