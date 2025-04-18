export interface InputBaseProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label displayed above the input */
  label?: string;
  /** Error message to display when input has an error */
  errorMessage?: string;
  /** Whether the input is in an error state */
  hasError?: boolean;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Input field size variant */
  size?: number;
  /** Whether the input should take the full width of its container */
  isFullWidth?: boolean;
  /** Icon to display at the start of the input */
  startIcon?: React.ReactNode;
  /** Icon to display at the end of the input */
  endIcon?: React.ReactNode;
  /** Whether the input should have a blurred effect */
  isBlurry?: boolean;
  /** Whether password visibility can be toggled (for password inputs) */
  canTogglePasswordVisibility?: boolean;
  /** Whether the input should be centered */
  isCentered?: boolean;
  /** Whether the input should auto-size */
  autoSize?: boolean;
}
