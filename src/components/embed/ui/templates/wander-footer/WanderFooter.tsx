import { WanderIcon } from "../../atoms";
import { AnimatedNoUnpartitionedStateBanner } from "~components/embed/ui/templates/no-unpartitioned-state-banner/NoUnpartitionedStateBanner";

import styles from "./WanderFooter.module.scss";

export function WanderFooter() {
  return (
    <footer className={styles.root}>
      <div className={styles.attribution}>
        Secured by <WanderIcon />
      </div>

      <AnimatedNoUnpartitionedStateBanner className={styles.banner} />
    </footer>
  );
}
