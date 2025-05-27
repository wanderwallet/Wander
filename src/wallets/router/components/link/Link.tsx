import type React from "react";
import type { PropsWithChildren } from "react";
import { Link as Wink } from "wouter";
import type { WanderRoutePath } from "~wallets/router/router.types";
import clsx from "clsx";

import styles from "./Link.module.scss";

export interface LinkProps extends PropsWithChildren {
  className?: string;
  to: WanderRoutePath;
  state?: unknown;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties;
  rel?: string;
}

export function Link({ className, ...props }: LinkProps) {
  return <Wink {...props} className={clsx(className, styles.root)} />;
}
