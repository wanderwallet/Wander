import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Copyable.module.css";
import type { CopyableBaseProps } from "./Copyable.types";
import { Loading } from "../loading";
import { Box } from "../box";
import { Text } from "../text";
import { CopyableIcon } from "../icon";
import { useTheme } from "../../../contexts/ThemeContext";

const Copyable = forwardRef<HTMLDivElement, CopyableBaseProps>(
  (
    {
      label,
      value,
      className,
      size = "md",
      isFullWidth,
      isBlurry,
      isLoading,
      isDisabled,
      onClick,
      tooltipValue,
      style,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    const textColor = isDarkMode
      ? "var(--color-copyable-text-value)"
      : "#191919";
    const iconColor = isDarkMode
      ? "var(--color-copyable-text-label)"
      : "#757575";

    return (
      <div
        ref={ref}
        className={clsx(
          styles.copyable,
          styles[`copyable__${size}`],
          isFullWidth && styles.copyable__full__width,
          isBlurry && styles.copyable__blurry,
          isDisabled && styles.copyable__disabled,
          isDarkMode ? styles.copyable__dark : styles.copyable__light,
          className
        )}
        style={style}
        {...props}
      >
        {isLoading ? (
          <Loading />
        ) : (
          <Box alignment="left">
            <div className={styles.tooltip}>
              <Text
                variant="bodyMd"
                style={{
                  color: isDarkMode
                    ? "var(--color-copyable-text-label)"
                    : undefined
                }}
              >
                {label}
              </Text>
              <button
                className={styles.copyable__button}
                onClick={onClick}
                disabled={isDisabled}
              >
                {tooltipValue && (
                  <span className={styles.tooltiptext}>{tooltipValue}</span>
                )}
                <Text
                  className={styles.text__label}
                  variant="bodyLg"
                  style={{ color: textColor }}
                >
                  {value}
                </Text>
                <CopyableIcon color={iconColor} />
              </button>
            </div>
          </Box>
        )}
      </div>
    );
  }
);

Copyable.displayName = "Copyable";

export { Copyable };
