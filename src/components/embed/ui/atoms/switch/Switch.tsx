import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Switch.module.css";
import type { SwitchBaseProps } from "./Switch.types";
import { useTheme } from "../../../contexts/ThemeContext";

const Switch = forwardRef<HTMLInputElement, SwitchBaseProps>(
  (
    {
      checked,
      disabled,
      onChange,
      className,
      id,
      label,
      labelPosition = "right",
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();

    return (
      <div
        className={clsx(
          styles.switchContainer,
          styles[`switchContainer__${labelPosition}`],
          className
        )}
      >
        {label && labelPosition === "left" && (
          <label
            htmlFor={id}
            className={styles.switchLabel}
            style={{
              color: isDarkMode ? "var(--color-font-body)" : undefined
            }}
          >
            {label}
          </label>
        )}
        <div className={styles.switchWrapper}>
          <input
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className={clsx(
              styles.switch,
              checked && styles.switchChecked,
              disabled && styles.switchDisabled
            )}
            {...props}
          />
          <span
            className={styles.slider}
            style={{
              backgroundColor: checked
                ? "var(--color-background-switch-enabled)"
                : isDarkMode
                ? "var(--color-button-secondary-background)"
                : undefined
            }}
          />
        </div>
        {label && labelPosition === "right" && (
          <label
            htmlFor={id}
            className={styles.switchLabel}
            style={{
              color: isDarkMode ? "var(--color-font-body)" : undefined
            }}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
