import { Redirect as Wedirect } from "wouter";
import type { WanderRoutePath } from "~wallets/router/router.types";

export interface RedirectProps {
  to: WanderRoutePath;
  state?: unknown;
}

export function Redirect(props: RedirectProps) {
  return <Wedirect {...props} />;
}
