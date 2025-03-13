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
      isShortened = true,
      isButtonOnly = false,
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
      : "#666666";
    const iconColor = isDarkMode
      ? "var(--color-copyable-text-label)"
      : "#666666";

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
                {!isButtonOnly && (
                  <Text
                    className={styles.text__label}
                    variant="bodyLg"
                    style={{ color: textColor }}
                  >
                    {isShortened
                      ? value.slice(0, 4).toLocaleLowerCase() +
                        "..." +
                        value.slice(-4).toLocaleLowerCase()
                      : value.toLocaleLowerCase()}
                  </Text>
                )}
                <CopyableIcon
                  color={iconColor}
                  width={16}
                  height={16}
                  style={{ justifySelf: "flex-end" }}
                />
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
