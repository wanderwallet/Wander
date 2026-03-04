import { WanderIcon } from "../../atoms";

import styles from "./WanderFooter.module.scss";

export function WanderFooter() {
  return (
    <footer className={styles.root}>
      <div className={styles.attribution}>
        Secured by <WanderIcon />
      </div>
      <div className={styles.links}>
        <a
          href="https://www.wander.app/legal/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}>
          Privacy Policy
        </a>
        <a
          href="https://www.wander.app/legal/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.link}>
          Terms of Service
        </a>
      </div>
    </footer>
  );
}
