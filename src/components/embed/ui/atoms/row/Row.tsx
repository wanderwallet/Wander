import { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Row.module.css";
import type { RowBaseProps } from "./Row.types";

const Row = forwardRef<HTMLDivElement, RowBaseProps>(
  (
    {
      children,
      className,
      alignment = "center",
      justifyContent = "center",
      isFullWidth = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          styles.row,
          styles[`row__align_${alignment}`],
          styles[`row__justify_${justifyContent}`],
          isFullWidth && styles.row__full_width,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Row.displayName = "Row";

export { Row };
