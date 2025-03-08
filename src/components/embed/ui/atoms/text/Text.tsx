import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Text.module.css";
import type { TextBaseProps } from "./Text.types";
import { useTheme } from "../../../contexts/ThemeContext";

const Text = forwardRef<HTMLParagraphElement, TextBaseProps>(
  (
    {
      children,
      variant = "bodyMd",
      alignment = "left",
      className,
      style,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    const isHeading = variant.startsWith("heading");
    const textColor = isDarkMode
      ? isHeading
        ? "var(--color-font-heading)"
        : "var(--color-font-body)"
      : style?.color;

    const Component = isHeading ? "h2" : "span";
    const textStyle = {
      ...style,
      color: textColor
    };

    return (
      <Component
        ref={ref}
        className={clsx(
          styles.text,
          styles[variant],
          styles[`text__${alignment}`],
          className
        )}
        style={textStyle}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = "Text";

export { Text };
