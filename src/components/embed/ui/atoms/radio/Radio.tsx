import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Radio.module.css";
import type { RadioBaseProps } from "./Radio.types";
import { Text } from "..";

const Radio = forwardRef<HTMLDivElement, RadioBaseProps>(
  (
    {
      id,
      name,
      label,
      description,
      className,
      isChecked,
      isDisabled,
      isRequired,
      isBlurry,
      onChange,
      ...props
    },
    ref
  ) => {
    return (
      <div
        className={clsx(
          styles.radio,
          isBlurry && styles.radio__blurry,
          className
        )}
        ref={ref}
        {...props}
      >
        <label className={styles.radio__label} htmlFor={id}>
          <input
            id={id}
            name={name}
            type="radio"
            className={styles.radio__input}
            checked={isChecked}
            disabled={isDisabled}
            required={isRequired}
            onChange={onChange}
          />
          <div className={styles.radio__content}>
            <span className={styles.radio__text}>{label}</span>
            {description && (
              <Text variant="bodyXs" className={styles.radio__description}>
                {description}
              </Text>
            )}
          </div>
        </label>
      </div>
    );
  }
);

Radio.displayName = "Radio";

export { Radio };
