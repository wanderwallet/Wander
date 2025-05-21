import type React from "react";
import type { PropsWithChildren } from "react";
import { Link as Wink } from "wouter";
import browser from "~iframe/browser";
import type { ExternalURL, WanderRoutePath } from "~wallets/router/router.types";

export interface LinkProps extends PropsWithChildren {
  className?: string;
  to: WanderRoutePath | ExternalURL;
  state?: unknown;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  style?: React.CSSProperties;
}

export function Link(props: LinkProps) {
  const isExternalLink = !props.to?.startsWith("/");

  const openExternalLink = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.type !== "click" && (e.type !== "mousedown" || e.button !== 1)) return;

    e.preventDefault();

    browser.tabs.create({
      url: props.to,
    });
  }

  return isExternalLink ? (
    <a
      { ...props }
      rel="noopener noreferrer"
      target="_blank"
      onClick={openExternalLink}
      onMouseDown={ openExternalLink } />
  ) : (
    <Wink {...props} />
  );
}
