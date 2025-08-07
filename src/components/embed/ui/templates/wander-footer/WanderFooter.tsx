import { WanderIcon } from "../../atoms";

import styles from "./WanderFooter.module.scss";

export function WanderFooter() {
  return (
    <footer className={styles.root}>
      <div className={styles.attribution}>
        Secured by <WanderIcon />
      </div>
    </footer>
  );
}
