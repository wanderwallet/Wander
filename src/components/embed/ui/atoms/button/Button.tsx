import clsx from "clsx";
import { Link } from "~wallets/router/components/link/Link";
import type { ButtonProps } from "./Button.types";
import { Loading } from "@arconnect/components";

import styles from "./Button.module.scss";

export function Button(props: ButtonProps) {
  const {
    children,
    className: classNameProp,
    variant = "primary",
    alignment = "center",
    size = "md",
    isFullWidth,
    isDisabled,
    isLoading,
    isBlurry,
    icon,
    hasBorder = true,
    style,
    tabIndex,
  } = props;

  const hasSize = !("href" in props) || !isFullWidth;

  const content = (
    <>
      <span className={styles.loaderCover}>{isLoading ? <Loading /> : null}</span>
      {icon}
      {children}
    </>
  );

  const className = clsx(
    styles.button,
    styles[`button__${alignment}`],
    hasSize && styles[`button__${size}`],
    styles[`button__variant__${variant}`],
    isBlurry && styles["button__blurry"],
    isFullWidth && styles["button__full__width"],
    (isDisabled || isLoading) && styles["isDisabled"],
    isLoading && styles["isLoading"],
    !hasBorder && styles["button__borderless"],
    classNameProp,
  );

  if ("href" in props) {
    const { href, onClick } = props;

    return (
      <Link
        to={href}
        rel="noopener noreferrer"
        className={className}
        style={style}
        // disabled={isDisabled || isLoading}
        // tabIndex={ tabIndex }
        onClick={onClick}>
        {content}
      </Link>
    );
  }

  const { type = "button", onClick } = props;

  return (
    <button
      type={type}
      className={className}
      style={style}
      disabled={isDisabled || isLoading}
      tabIndex={tabIndex}
      onClick={onClick}>
      {content}
    </button>
  );
}
