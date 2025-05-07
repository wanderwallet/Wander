import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Link.module.css";
import type { LinkBaseProps } from "./Link.types";
import { useTheme } from "../../../contexts/ThemeContext";

const Link = forwardRef<HTMLAnchorElement, LinkBaseProps>(
  (
    {
      href,
      children,
      target = "_blank",
      rel = "noopener noreferrer",
      variant = "primary",
      disabled,
      className,
      icon,
      iconPosition = "left",
      ...props
    },
    ref,
  ) => {
    const { isDarkMode } = useTheme();

    const linkColor = disabled
      ? "var(--color-link-disabled)"
      : variant === "primary"
        ? "var(--color-link-primary)"
        : "var(--color-link-secondary)";

    return (
      <a
        ref={ref}
        href={disabled ? undefined : href}
        target={target}
        rel={rel}
        className={clsx(
          styles.link,
          styles[`link__${variant}`],
          disabled && styles.linkDisabled,
          icon && styles[`link__icon_${iconPosition}`],
          className,
        )}
        style={{ color: linkColor }}
        {...props}>
        {icon && iconPosition === "left" && <span className={styles.icon}>{icon}</span>}
        {children}
        {icon && iconPosition === "right" && <span className={styles.icon}>{icon}</span>}
      </a>
    );
  },
);

Link.displayName = "Link";

export { Link };
