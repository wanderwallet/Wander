import React from "react";
import styles from "./Text.module.css";
import type { TextBaseProps } from "./Text.types";

const Text = React.forwardRef<HTMLSpanElement, TextBaseProps>(
  (
    { children, className, alignment = "left", variant = "bodyMd", ...props },
    ref
  ) => {
    const Component = "span";

    const type = variant.slice(0, -2);

    return (
      <Component
        ref={ref}
        className={`
        ${styles["text"]}
        ${styles[`text__${alignment}`]}
        ${styles[`text__${type}`]}
        ${styles[`text__variant__${variant}`]}
        ${className}
      `}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";

export { Text };
