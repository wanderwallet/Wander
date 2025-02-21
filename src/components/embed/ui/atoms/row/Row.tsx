import React from "react";
import styles from "./Row.module.css";
import type { RowBaseProps } from "./Row.types";

const Row = React.forwardRef<HTMLDivElement, RowBaseProps>(
  (
    {
      children,
      className,
      position = "relative",
      alignment = "center",
      isOverlap = false,
      ...props
    },
    ref
  ) => {
    const Component = "div";

    return (
      <Component
        ref={ref}
        className={`
        ${styles["row"]}
        ${styles[`row__${position}`]}
        ${styles[`row__${alignment}`]}
        ${isOverlap ? styles["row__overlap"] : ""}
        ${className}
      `}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Row.displayName = "Row";

export { Row };
