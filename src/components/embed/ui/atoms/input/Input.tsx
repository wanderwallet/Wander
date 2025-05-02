import React, { forwardRef, useState, useRef, useEffect } from "react";
import clsx from "clsx";
import styles from "./Input.module.css";
import { Text } from "../text";
import { Box } from "../box";
import { EyeIcon, EyeOffIcon } from "~components/embed/ui/atoms/icon";
import type { InputBaseProps } from "./Input.types";

const Input = forwardRef<HTMLInputElement, InputBaseProps>(
  (
    {
      label,
      errorMessage,
      hasError = false,
      helperText,
      className = "",
      size = "md",
      isFullWidth = false,
      startIcon,
      endIcon,
      isBlurry = false,
      type = "text",
      canTogglePasswordVisibility = false,
      disabled,
      value,
      isCentered = false,
      autoSize = false,
      placeholder = "",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [inputWidth, setInputWidth] = useState<string>("auto");
    const inputRef = useRef<HTMLInputElement | null>(null);
    const measureRef = useRef<HTMLSpanElement>(null);

    // Combine refs
    const handleRef = (el: HTMLInputElement | null) => {
      inputRef.current = el;
      if (typeof ref === "function") {
        ref(el);
      } else if (ref) {
        ref.current = el;
      }
    };

    const inputType = type === "password" && showPassword ? "text" : type;

    const togglePasswordVisibility = () => {
      setShowPassword((prev) => !prev);
    };

    // Auto-size functionality
    useEffect(() => {
      if (autoSize && measureRef.current && inputRef.current) {
        const displayValue = (value as string) || placeholder || "0";
        measureRef.current.textContent = displayValue;

        // Get width of text + some padding
        const textWidth = measureRef.current.getBoundingClientRect().width;

        // Set min width for small inputs (like "0")
        const minWidth = placeholder === "0.00" ? 80 : 20;
        const newWidth = Math.max(textWidth + 10, minWidth);

        setInputWidth(`${newWidth}px`);
      }
    }, [value, placeholder, autoSize]);

    return (
      <Box alignment="center" className={styles.input__container}>
        {label && (
          <Text
            variant="bodyMd"
            className={styles.input__label}
            style={{ color: hasError ? "var(--color-error)" : undefined }}
          >
            {label}
          </Text>
        )}

        <div className={styles.input__wrapper}>
          {startIcon && (
            <div className={styles.input__icon__start}>{startIcon}</div>
          )}

          <input
            ref={handleRef}
            type={inputType}
            disabled={disabled}
            value={value}
            placeholder={placeholder}
            className={clsx(
              styles.input,
              styles[`input__${size}`],
              isFullWidth && styles.input__full__width,
              hasError && styles.input__error,
              isBlurry && styles.input__blurry,
              startIcon && styles.input__has__start__icon,
              (endIcon ||
                (type === "password" && canTogglePasswordVisibility)) &&
                styles.input__has__end__icon,
              isCentered && styles.input__centered,
              autoSize && styles.input__auto_size,
              disabled && styles.input__disabled,
              className
            )}
            style={autoSize ? { width: inputWidth } : undefined}
            {...props}
          />

          {/* Hidden span to measure text width for auto-sizing */}
          {autoSize && (
            <span
              ref={measureRef}
              className={styles.input__measure}
              aria-hidden="true"
            >
              {(value as string) || placeholder || "0"}
            </span>
          )}

          {(endIcon ||
            (type === "password" && canTogglePasswordVisibility)) && (
            <div
              className={styles.input__icon__end}
              onClick={
                type === "password" && canTogglePasswordVisibility
                  ? togglePasswordVisibility
                  : undefined
              }
              style={
                type === "password" && canTogglePasswordVisibility
                  ? { cursor: "pointer" }
                  : undefined
              }
            >
              {type === "password" && canTogglePasswordVisibility ? (
                showPassword ? (
                  <EyeOffIcon />
                ) : (
                  <EyeIcon />
                )
              ) : (
                endIcon
              )}
            </div>
          )}
        </div>

        {hasError && errorMessage && (
          <Text variant="bodySm" className={styles.input__error__message}>
            {errorMessage}
          </Text>
        )}

        {!hasError && helperText && (
          <Text variant="bodySm" className={styles.input__helper__text}>
            {helperText}
          </Text>
        )}
      </Box>
    );
  }
);

Input.displayName = "Input";

export { Input };
