import React from "react";
import styles from "./Snackbar.module.css";
import type { SnackbarBaseProps } from "./Snackbar.types";
import { Text, Row } from "../../atoms";
import { useTheme } from "../../../contexts/ThemeContext";

const Snackbar = React.forwardRef<HTMLDivElement, SnackbarBaseProps>(
  ({ text, textColor, icon, iconColor, borderColor, backgroundColor, isFullWidth, className, ...props }, ref) => {
    const { isDarkMode } = useTheme();

    const defaultBorderColor = isDarkMode ? "var(--color-border-box)" : borderColor || "var(--color-border-box)";

    const defaultBackgroundColor =
      backgroundColor || (isDarkMode ? "var(--color-card-background-default)" : "var(--color-background-default)");

    const defaultIconColor = iconColor || (isDarkMode ? "var(--color-font-body)" : iconColor);

    const defaultTextColor = isDarkMode ? "var(--color-font-body)" : textColor;

    return (
      <Row
        ref={ref}
        alignment="center"
        className={`
          ${styles["snackbar"]}
          ${isFullWidth && styles["snackbar__isFullWidth"]}
          ${className}
        `}
        style={{
          borderColor: defaultBorderColor,
          backgroundColor: defaultBackgroundColor,
        }}
        {...props}>
        {icon && (
          <div className={styles["snackbar__icon"]} style={{ color: defaultIconColor }}>
            {icon}
          </div>
        )}
        <Text variant="bodyMd" alignment="left" style={{ color: defaultTextColor }}>
          {text}
        </Text>
      </Row>
    );
  },
);

Snackbar.displayName = "Snackbar";

export { Snackbar };
