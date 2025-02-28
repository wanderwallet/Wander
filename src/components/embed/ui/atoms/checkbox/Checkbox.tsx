import React from "react";
import styles from "./Checkbox.module.css";
import type { CheckboxBaseProps } from "./Checkbox.types";
import { CheckIcon, Text } from "..";

const Checkbox = React.forwardRef<HTMLDivElement, CheckboxBaseProps>(
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
    const Component = "div";
    const Label = "label";

    return (
      <Component
        className={`
        ${styles["wrapper"]}
        ${className}
        ${isBlurry && styles["checkbox__blurry"]}
      `}
        {...props}
      >
        {isChecked && <CheckIcon className={styles["checkbox__icon"]} />}
        <Label
          id="checkbox"
          htmlFor="r1"
          className={`${styles["checkbox__label"]}`}
        >
          <input
            className={`${styles["checkbox"]}
             ${isChecked && styles["checkbox__checked"]}
             `}
            type="checkbox"
            name="rGroup"
            id="r1"
            checked={isChecked}
            onClick={handleChange}
          />
          {label}
        </Label>
        <Text variant="bodyXs" className={styles["checkbox__description"]}>
          {description}
        </Text>
      </Component>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
