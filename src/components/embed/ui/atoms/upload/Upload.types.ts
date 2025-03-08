import React from "react";
import type { Sizes } from "../../../types";

export interface FileUploadProps {
  // Basic props
  title?: string;
  description?: string;
  loadingText?: string;
  className?: string;
  isFullWidth?: boolean;
  isBlurry?: boolean;
  isLoading?: boolean;

  // File handling
  acceptedFileTypes?: string;
  maxFileSizeInMB?: number;

  // Callbacks
  onFileSelect?: (file: File) => void;
  onFileRead?: (content: string, file: File) => void;
  onFileParse?: <T>(parsedData: T, file: File) => void;
  onError?: (error: Error) => void;
}
