import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Row.module.css";
import type { RowBaseProps } from "./Row.types";
import { useTheme } from "../../../contexts/ThemeContext";

const Row = forwardRef<HTMLDivElement, RowBaseProps>(
  (
    {
      children,
      className,
      alignment = "center",
      justifyContent = "center",
      style,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    const rowStyle = {
      ...style,
      backgroundColor: isDarkMode
        ? "var(--color-card-background-default)"
        : style?.backgroundColor
    };

    return (
      <div
        ref={ref}
        className={clsx(
          styles.row,
          styles[`row__align_${alignment}`],
          styles[`row__justify_${justifyContent}`],
          className
        )}
        style={rowStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Row.displayName = "Row";

export { Row };
