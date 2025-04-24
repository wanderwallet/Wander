import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Box.module.css";
import type { BoxBaseProps } from "./Box.types";
import { useTheme } from "../../../contexts/ThemeContext";

const Box = forwardRef<HTMLDivElement, BoxBaseProps>(
  (
    {
      children,
      className,
      position = "relative",
      alignment = "center",
      hasBorder = false,
      isBlurry = false,
      isAutoWidth = false,
      style,
      onClick,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    const themeStyles = {
      ...style,
      backgroundColor:
        isDarkMode && hasBorder
          ? "var(--color-background-default)"
          : style?.backgroundColor
    };

    return (
      <div
        className={clsx(
          styles.box,
          styles[`box__${position}`],
          styles[`box__${alignment}`],
          hasBorder && styles.box__border,
          isBlurry && styles.box__blurry,
          isAutoWidth && styles.box__width_auto,
          isDarkMode ? styles.box__dark : styles.box__light,
          className
        )}
        style={themeStyles}
        ref={ref}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Box.displayName = "Box";

export { Box };
