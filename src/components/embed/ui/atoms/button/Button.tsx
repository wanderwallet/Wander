import React from "react";
import styles from "./Button.module.css";
import type { ButtonBaseProps } from "./Button.types";
import { Loading } from "../loading";

const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonBaseProps
>(
  (
    {
      children,
      className,
      variant = "primary",
      iconPosition = "start",
      alignment = "center",
      size = "md",
      isFullWidth,
      isDisabled,
      isLoading,
      isBlurry,
      loadingChildren,
      icon,
      hasBorder,
      onClick,
      color,
      ...props
    },
    ref
  ) => {
    const isAnchor = variant === "link" && props.href;

    const Component = isAnchor ? "a" : "button";

    const hasSize = !isAnchor || !isFullWidth;

    const handleChildren = () => {
      if (isLoading) {
        return <Loading isAnchor={Boolean(isAnchor)} />;
      }
      if (icon) {
        return iconPosition === "start" ? (
          <>
            {icon} {children}
          </>
        ) : (
          <>
            {children} {icon}
          </>
        );
      }
      return children;
    };

    return (
      <Component
        ref={ref}
        href={isAnchor ? props.href : undefined}
        target="_blank"
        rel="noopener noreferrer"
        className={`
        ${styles["button"]}
        ${className}
        ${styles[`button__${alignment}`]}
        ${styles[`button--icon-${iconPosition}`]}
        ${hasSize && styles[`button__${size}`]}
        ${styles[`button__variant__${variant}`]}
        ${isBlurry && styles["button__blurry"]}
        ${isFullWidth && styles["button__full__width"]}
      `}
        style={{ borderColor: color, color: color }}
        disabled={isDisabled ?? isLoading}
        {...props}
      >
        {handleChildren()}
      </Component>
    );
  }
);

Button.displayName = "Button";

export { Button };
