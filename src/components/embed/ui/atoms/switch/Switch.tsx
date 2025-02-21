import React from "react";
import styles from "./Switch.module.css";
import type { SwitchBaseProps } from "./Switch.types";

const Switch = React.forwardRef<HTMLDivElement, SwitchBaseProps>(
  ({ className, ...props }, ref) => {
    const Component = "input";

    return (
      <Component
        type="checkbox"
        className={`
        ${styles["checkbox"]}
        ${className}`}
        {...props}
      />
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
