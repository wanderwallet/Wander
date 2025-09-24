import { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Column.module.css";
import type { ColumnBaseProps } from "./Column.types";

const Column = forwardRef<HTMLDivElement, ColumnBaseProps>(
  (
    {
      children,
      className,
      alignment = "center",
      justifyContent = "center",
      isFullWidth = false,
      spacing = "sm",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          styles.column,
          styles[`column__align_${alignment}`],
          styles[`column__justify_${justifyContent}`],
          spacing && styles[`column__spacing_${spacing}`],
          isFullWidth && styles.column__full_width,
          className,
        )}
        {...props}>
        {children}
      </div>
    );
  },
);

Column.displayName = "Column";

export { Column };
