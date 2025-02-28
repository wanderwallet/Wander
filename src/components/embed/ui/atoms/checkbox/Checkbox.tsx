import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Checkbox.module.css";
import type { CheckboxBaseProps } from "./Checkbox.types";
import { CheckIcon, Text } from "..";
import { useTheme } from "../../../contexts/ThemeContext";

const Checkbox = forwardRef<HTMLDivElement, CheckboxBaseProps>(
  (
    {
      id,
      label,
      description,
      className,
      isChecked,
      isDisabled,
      isRequired,
      isBlurry,
      hasBorder,
      handleChange,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    return (
      <div
        className={clsx(
          styles.wrapper,
          isBlurry && styles.checkbox__blurry,
          isDarkMode ? styles.checkbox__dark : styles.checkbox__light,
          className
        )}
        ref={ref}
        {...props}
      >
        <label
          id="checkbox"
          htmlFor={id || "r1"}
          className={styles.checkbox__label}
        >
          <div className={styles.checkbox__input_container}>
            <input
              className={clsx(
                styles.checkbox,
                isChecked && styles.checkbox__checked
              )}
              type="checkbox"
              name="rGroup"
              id={id || "r1"}
              checked={isChecked}
              disabled={isDisabled}
              required={isRequired}
              onClick={handleChange}
            />
            {isChecked && (
              <CheckIcon
                className={styles.checkbox__icon}
                color={
                  isDarkMode ? "var(--color-background-default)" : undefined
                }
              />
            )}
          </div>
          <div className={styles.checkbox__text}>
            <span>{label}</span>
            {description && (
              <Text variant="bodyXs" className={styles.checkbox__description}>
                {description}
              </Text>
            )}
          </div>
        </label>
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
