import { WanderIcon } from "../../atoms";
import { NoUnpartitionedStorageBanner } from "~components/embed/ui/templates/no-unpartitioned-storage-banner/NoUnpartitionedStorageBanner";

import styles from "./WanderFooter.module.scss";

export function WanderFooter() {
  return (
    <footer className={styles.root}>
      <div className={styles.attribution}>
        Secured by <WanderIcon />
      </div>

      <NoUnpartitionedStorageBanner className={styles.banner} />
    </footer>
  );
}
