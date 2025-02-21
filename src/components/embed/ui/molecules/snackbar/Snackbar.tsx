import React from "react";
import styles from "./Snackbar.module.css";
import { SnackbarBaseProps } from "./Snackbar.types";

import { Text, Row } from "../../atoms";

const Snackbar = React.forwardRef<HTMLDivElement, SnackbarBaseProps>(
  (
    {
      text,
      textColor,
      icon,
      iconColor,
      borderColor,
      backgroundColor,
      isFullWidth,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <Row
        ref={ref}
        alignment="center"
        className={`
        ${styles["snackbar"]}
        ${isFullWidth && styles["snackbar__isFullWidth"]}
        ${className}`}
        style={{
          borderColor: borderColor,
          backgroundColor: backgroundColor
        }}
        {...props}
      >
        {icon && (
          <div
            className={styles["snackbar__icon"]}
            style={{ color: iconColor }}
          >
            {icon}
          </div>
        )}
        <Text variant="bodySm" alignment="left">
          {text}
        </Text>
      </Row>
    );
  }
);

Snackbar.displayName = "Snackbar";

export { Snackbar };
