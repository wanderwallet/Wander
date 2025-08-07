import type React from "react";
import type { PropsWithChildren } from "react";
import { Link as Wink } from "wouter";
import type { WanderRoutePath } from "~wallets/router/router.types";
import clsx from "clsx";

import styles from "./Link.module.scss";

function disabledOnClickHandler(e: React.MouseEvent<HTMLAnchorElement>) {
  e.preventDefault();
}

export interface LinkProps extends PropsWithChildren {
  to: WanderRoutePath;
  rel?: string;
  state?: unknown;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function Link({ to, onClick: onClickProp, className, disabled, ...props }: LinkProps) {
  const onClick = disabled ? disabledOnClickHandler : onClickProp;

  return (
    <Wink
      {...props}
      to={to}
      onClick={onClick}
      className={clsx(className, styles.root, { [styles.disabled]: disabled })}
    />
  );
}
