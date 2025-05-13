import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./TextInput.module.css";
import type { TextInputBaseProps } from "./TextInput.types";
import { Button } from "../button";

const TextInput = forwardRef<HTMLInputElement, TextInputBaseProps>(
  (
    {
      placeholder,
      type = "text",
      hasButton = false,
      buttonLabel,
      buttonIcon,
      isDisabled,
      isSecure,
      buttonOnClick,
      isLoading,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    const Component = "div";
    const inputType = isSecure ? "password" : type;
    return (
      <Component className={clsx(styles["wrapper"], className)} style={style} {...props}>
        <input ref={ref} type={inputType} placeholder={placeholder} className={styles["input"]} disabled={isDisabled} />
        {hasButton && (buttonLabel || buttonIcon) && (
          <Button
            variant={buttonIcon ? "icon" : "primary"}
            className={clsx(styles["button"], buttonLabel ? styles["button__text"] : styles["button__icon"], className)}
            onClick={buttonOnClick}
            isLoading={isLoading}
            isDisabled={isDisabled}
            tabIndex={-1}>
            {buttonIcon || buttonLabel}
          </Button>
        )}
      </Component>
    );
  },
);

TextInput.displayName = "TextInput";

export { TextInput };
