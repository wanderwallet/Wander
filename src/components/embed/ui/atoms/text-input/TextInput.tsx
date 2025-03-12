import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./TextInput.module.css";
import type { TextInputBaseProps } from "./TextInput.types";

const TextInput = forwardRef<HTMLInputElement, TextInputBaseProps>(
  (
    {
      placeholder,
      hasButton = false,
      buttonLabel,
      isSecure,
      buttonOnClick,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const Component = "div";
    const type = isSecure ? "password" : "text";
    return (
      <Component className={clsx(styles["wrapper"], className)} {...props}>
        <input
          ref={ref}
          type={type}
          placeholder={placeholder}
          className={styles["input"]}
        />
        {hasButton && buttonLabel && (
          <button
            className={clsx(
              styles["button"],
              styles["button__text"],
              className
            )}
            onClick={buttonOnClick}
          >
            {buttonLabel}
          </button>
        )}
      </Component>
    );
  }
);

TextInput.displayName = "TextInput";

export { TextInput };
