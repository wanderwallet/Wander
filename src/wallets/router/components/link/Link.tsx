import type React from "react";
import type { PropsWithChildren } from "react";
import { Link as Wink } from "wouter";
import type { WanderRoutePath } from "~wallets/router/router.types";

export interface LinkProps extends PropsWithChildren {
  to: WanderRoutePath;
  state?: unknown;
  onClick?: React.MouseEventHandler<HTMLLinkElement>;
}

export function Link(props: LinkProps) {
  return <Wink {...props} />;
}
