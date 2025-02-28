import React from "react";
import clsx from "clsx";
import { Link } from "~wallets/router/components/link/Link";
import styles from "./Button.module.css";
import type { ButtonBaseProps } from "./Button.types";
import { Loading } from "../loading";
import { useTheme } from "../../../contexts/ThemeContext";

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
      color,
      ...props
    },
    ref
  ) => {
    const { isDarkMode } = useTheme();
    const isAnchor = variant === "link" || props.href;
    const Component = isAnchor ? Link : "button";
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
    console.log({ isDarkMode });
    return (
      <Component
        ref={ref}
        href={isAnchor ? props.href : undefined}
        rel="noopener noreferrer"
        className={clsx(
          styles.button,
          styles[`button__${alignment}`],
          styles[`button--icon-${iconPosition}`],
          hasSize && styles[`button__${size}`],
          styles[`button__variant__${variant}`],
          isBlurry && styles.button__blurry,
          isFullWidth && styles.button__full__width,
          isDarkMode && styles.button__dark,
          className
        )}
        style={color ? { borderColor: color, color } : undefined}
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
