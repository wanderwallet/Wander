import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Copyable.module.css";
import type { CopyableBaseProps } from "./Copyable.types";
import { Loading } from "../loading";
import { Box, Text, CopyableIcon } from "..";
import { useTheme } from "../../../contexts/ThemeContext";

const Copyable = forwardRef<HTMLDivElement, CopyableBaseProps>(
  (
    {
      label,
      value,
      hasBorder = true,
      isShortened = false,
      isButtonOnly = false,
      buttonText,
      className,
      size = "md",
      isFullWidth,
      isBlurry,
      isLoading,
      isDisabled,
      onClick,
      style,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    const textColor = isDarkMode
      ? "var(--color-copyable-text-value)"
      : "#666666";
    const iconColor = isDarkMode
      ? "var(--color-copyable-text-label)"
      : "#666666";

    const displayValue = isShortened
      ? value.slice(0, 4).toLocaleLowerCase() +
        "..." +
        value.slice(-4).toLocaleLowerCase()
      : value.toLocaleLowerCase();

    return (
      <div
        ref={ref}
        className={clsx(
          styles.copyable,
          styles[`copyable__${size}`],
          isFullWidth && styles.copyable__full__width,
          isBlurry && styles.copyable__blurry,
          isDisabled && styles.copyable__disabled,
          hasBorder && styles.copyable__border,
          className
        )}
        style={style}
        {...props}
      >
        {isLoading ? (
          <Loading />
        ) : (
          <Box alignment="left" className={styles.copyable__container}>
            <Text
              variant="bodyMd"
              className={styles.copyable__label}
              style={{
                color: isDarkMode
                  ? "var(--color-copyable-text-label)"
                  : undefined
              }}
            >
              {label}
            </Text>
            <div className={styles.copyable__content}>
              {!isButtonOnly && (
                <Text
                  className={styles.copyable__value}
                  variant="bodyLg"
                  style={{ color: textColor }}
                >
                  {displayValue}
                </Text>
              )}
              <button
                className={styles.copyable__button}
                onClick={onClick}
                disabled={isDisabled}
                aria-label="Copy to clipboard"
              >
                {buttonText}
                <CopyableIcon color={iconColor} width={16} height={16} />
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
