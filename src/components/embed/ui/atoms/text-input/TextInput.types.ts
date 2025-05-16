import React from "react";

export interface TextInputProps {
  // Moved over from `React.InputHTMLAttributes<HTMLInputElement` but made mandatory as needed. Please, do not extend as
  // that adds a lot of noise and overhead to the compiler:
  type?: "text" | "email" | "password";
  name: string;
  placeholder: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  readOnly?: boolean;

  // Custom input props:
  inputRef?: React.Ref<HTMLInputElement>;
  startSlot?: React.ReactElement;
  endSlot?: React.ReactElement;

  // Root element props:
  className?: string;
  style?: React.CSSProperties;
}
