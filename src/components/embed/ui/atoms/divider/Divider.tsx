import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Divider.module.css";
import type { DividerBaseProps } from "./Divider.types";
import { Text } from "..";
import { useTheme } from "../../../contexts/ThemeContext";

const Divider = forwardRef<HTMLDivElement, DividerBaseProps>(
  ({ text, textPosition = "center", className, ...props }, ref) => {
    const { isDarkMode } = useTheme();

    const cardBackground = isDarkMode
      ? "var(--brand-color-neutral1)"
      : "var(--brand-color-neutral6)";

    return (
      <div
        ref={ref}
        className={clsx(
          styles.divider,
          text && styles[`divider--text-${textPosition}`],
          className
        )}
        style={{
          borderColor: isDarkMode ? "var(--color-divider-default)" : undefined
        }}
        {...props}
      >
        {text && (
          <Text
            alignment={textPosition}
            className={styles.divider__text}
            variant="bodyXs"
            style={{
              backgroundColor: cardBackground
            }}
          >
            {text}
          </Text>
        )}
      </div>
    );
  }
);

Divider.displayName = "Divider";

export { Divider };
