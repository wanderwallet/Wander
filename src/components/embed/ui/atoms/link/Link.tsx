import React from "react";
import styles from "./Link.module.css";
import type { LinkBaseProps } from "./Link.types";

const Link = React.forwardRef<HTMLAnchorElement, LinkBaseProps>(
  (
    {
      className,
      linkText,
      href,
      iconLeft,
      iconRight,
      onClick,
      isDisabled,
      ...props
    },
    ref
  ) => {
    const Component = "a";

    return (
      <Component
        ref={ref}
        className={`
        ${styles["link"]}
        ${className}
        ${isDisabled && styles["isDisabled"]}
      `}
        {...props}
      >
        {iconLeft && (
          <div
            className={`
          ${styles["button__icon"]}
          ${styles["button--icon-left"]}`}
          >
            {iconLeft}
          </div>
        )}
        {linkText}
        {iconRight && (
          <div
            className={`
          ${styles["button__icon"]}
          ${styles["button--icon-right"]}`}
          >
            {iconRight}
          </div>
        )}
      </Component>
    );
  }
);

Link.displayName = "Link";

export { Link };
