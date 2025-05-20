import React, { forwardRef, useCallback } from "react";
import clsx from "clsx";
import styles from "./Switch.module.css";
import type { SwitchBaseProps } from "./Switch.types";
import { useTheme } from "../../../contexts/ThemeContext";
import { Text } from "~components/embed/ui";

const Switch = forwardRef<HTMLInputElement, SwitchBaseProps>(
  (
    {
      isChecked,
      isDisabled,
      handleChange,
      className,
      id,
      label,
      description,
      labelPosition = "right",
      size = 24,
      ...props
    },
    ref,
  ) => {
    const { isDarkMode } = useTheme();

    const toggle = useCallback(() => {
      if (!isDisabled && handleChange) {
        const syntheticEvent = {
          target: { checked: !isChecked },
          preventDefault: () => {},
          stopPropagation: () => {},
        } as React.ChangeEvent<HTMLInputElement>;

        handleChange(syntheticEvent);
      }
    }, [handleChange, isChecked, isDisabled]);

    // Calculate dimensions based on size prop
    const switchWidth = Math.round(size * 1.6);
    const switchHeight = size;
    const knobSize = Math.round(switchHeight * 0.85);
    const knobOffset = Math.round((switchHeight - knobSize) / 2);
    const translateX = switchWidth - knobSize - knobOffset * 2;

    return (
      <div
        className={clsx(styles.switchContainer, styles[`switchContainer__${labelPosition}`], className)}
        onClick={toggle}>
        <div
          className={styles.switch__wrapper}
          style={{
            width: `${switchWidth}px`,
            height: `${switchHeight}px`,
          }}>
          <input
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            checked={isChecked}
            disabled={isDisabled}
            onChange={(e) => handleChange?.(e)}
            className={clsx(styles.switch, isChecked && styles.switch__checked, isDisabled && styles.switch__disabled)}
            aria-checked={isChecked}
            {...props}
          />
          <span
            className={styles.slider}
            style={
              {
                backgroundColor: isChecked
                  ? "var(--color-background-switch-enabled)"
                  : isDarkMode
                  ? "var(--color-button-secondary-background)"
                  : undefined,
                borderRadius: `${switchHeight / 2}px`,
                "--knob-size": `${knobSize}px`,
                "--knob-offset": `${knobOffset}px`,
                "--translate-x": `${translateX}px`,
              } as React.CSSProperties
            }
          />
        </div>
        {(label || description) && (
          <div className={styles.switch__content}>
            {label && <span className={styles.switch__label}>{label}</span>}
            {description && (
              <Text variant="bodyXs" className={styles.switch__description}>
                {description}
              </Text>
            )}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
