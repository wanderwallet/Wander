import React from "react";
import styles from "./Radio.module.css";
import type { RadioBaseProps } from "./Radio.types";
import { CheckIcon } from "../icon";

const Radio = React.forwardRef<HTMLDivElement, RadioBaseProps>(
  ({
    id,
    label,
    className,
    isChecked,
    isDisabled,
    isRequired,
    isBlurry,
    handleChange,
    ...props
  }) => {
    const Component = "label";

    return (
      <Component
        id="radio"
        htmlFor="r1"
        className={`
        ${styles["wrapper"]}
        ${className}
        ${isBlurry && styles["radio__blurry"]}
      `}
        {...props}
      >
        <input
          className={`${styles["radio"]}
             ${isChecked && styles["radio__checked"]}
             `}
          type="radio"
          name="rGroup"
          id="r1"
          checked={true}
          onClick={handleChange}
        />
        {label}
        {isChecked && (
          <CheckIcon width={20} height={20} className={styles["radio__icon"]} />
        )}
      </Component>
    );
  }
);

Radio.displayName = "Radio";

export { Radio };
