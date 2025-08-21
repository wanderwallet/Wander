// Common base props for all components
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

// Common props for interactive elements
export interface InteractiveProps extends BaseProps {
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onFocus?: (event: React.FocusEvent) => void;
  onBlur?: (event: React.FocusEvent) => void;
}
