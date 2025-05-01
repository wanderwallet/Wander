import { forwardRef, useMemo, useState } from "react";
import clsx from "clsx";
import styles from "./Copyable.module.css";
import type { CopyableBaseProps } from "./Copyable.types";
import { Loading } from "../loading";
import { Box } from "../box";
import { Text } from "../text";
import { CopyableIcon, CheckIcon } from "../icon";
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
    const [isCopied, setIsCopied] = useState(false);

    const textColor = isDarkMode
      ? "var(--color-copyable-text-value)"
      : "#666666";

    const iconColor = useMemo(() => {
      return isDarkMode
        ? isCopied
          ? "#4ade80"
          : "var(--color-copyable-text-label)"
        : isCopied
        ? "#22c55e"
        : "#666666";
    }, [isDarkMode, isCopied]);

    const displayValue = isShortened
      ? value.slice(0, 4) + "..." + value.slice(-4)
      : value;

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
                onClick={(e) => {
                  onClick(e);
                  setIsCopied(true);
                  setTimeout(() => {
                    setIsCopied(false);
                  }, 1000);
                }}
                disabled={isDisabled}
                aria-label="Copy to clipboard"
              >
                {buttonText}
                {isCopied ? (
                  <CheckIcon
                    style={{ color: iconColor }}
                    width={16}
                    height={16}
                  />
                ) : (
                  <CopyableIcon
                    style={{ color: iconColor }}
                    width={16}
                    height={16}
                  />
                )}
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
