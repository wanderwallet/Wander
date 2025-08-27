import type React from "react";
import type { PropsWithChildren } from "react";
import { Link as Wink } from "wouter";
import browser from "webextension-polyfill";
import type { ExternalURL, WanderRoutePath } from "~wallets/router/router.types";
import clsx from "clsx";

import styles from "./Link.module.scss";

export interface LinkProps extends PropsWithChildren {
  to: WanderRoutePath | ExternalURL;
  state?: unknown;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

export function Link({ to, state, onClick, className, style, disabled, children }: LinkProps) {
  const isExternalLink = !to?.startsWith("/");

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (disabled) {
      e.preventDefault();
      return;
    }

    if (onClick) onClick(e);

    if (!isExternalLink) return;

    if (e.type !== "click" && (e.type !== "mousedown" || e.button !== 1)) return;

    e.preventDefault();

    browser.tabs.create({
      url: to,
    });
  };

  const rootClassName = clsx(className, styles.root, { [styles.disabled]: disabled });

  return isExternalLink ? (
    <a
      className={rootClassName}
      style={style}
      rel="noopener noreferrer"
      target="_blank"
      onClick={handleLinkClick}
      onMouseDown={handleLinkClick}
      children={children}
    />
  ) : (
    <Wink className={rootClassName} style={style} to={to} state={state} onClick={handleLinkClick} children={children} />
  );
}
