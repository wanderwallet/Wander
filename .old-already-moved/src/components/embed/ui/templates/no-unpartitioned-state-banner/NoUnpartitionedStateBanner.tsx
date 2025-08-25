import { useEmbedded } from "~utils/_embedded/embedded.hooks";
import { Link } from "~wallets/router/components/link/Link";
import { EmbeddedPaths } from "~wallets/router/iframe/iframe.routes";
import { AlertTriangle } from "@untitled-ui/icons-react";
import { useLocation } from "~wallets/router/router.utils";
import clsx from "clsx";

import styles from "./NoUnpartitionedStateBanner.module.scss";

export interface NoUnpartitionedStateBannerProps {
  className?: string;
  disableLink?: boolean;
}

export function NoUnpartitionedStateBanner({ className, disableLink }: NoUnpartitionedStateBannerProps) {
  const { location } = useLocation();
  const { unpartitionedStateStatus } = useEmbedded();

  return unpartitionedStateStatus !== "supported" && location !== EmbeddedPaths.SupportUnpartitionedStateMissing ? (
    <div className={clsx(styles.root, className)}>
      <AlertTriangle className={styles.icon} />
      <span>
        Limited browser support.{" "}
        <Link className={styles.link} to={EmbeddedPaths.SupportUnpartitionedStateMissing} disabled={disableLink}>
          Learn more
        </Link>
      </span>
    </div>
  ) : null;
}
