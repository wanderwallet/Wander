import { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Link.module.css";
import type { LinkBaseProps } from "./Link.types";

// TODO: Prevent middle button click for non-external links.

const UNUSED_Link = forwardRef<HTMLAnchorElement, LinkBaseProps>(
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

UNUSED_Link.displayName = "Link";

export { UNUSED_Link };
