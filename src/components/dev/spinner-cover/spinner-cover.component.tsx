import { DevSpinner } from "~components/dev/spinner/spinner.component";

import styles from "./spinner-cover.module.scss";

export interface DevSpinnerCoverProps {
  background?: "solid" | "semitransparent" | "blurred" | "none";
  label?: string;
}

export function DevSpinnerCover({
  background = "blurred",
  label
}: DevSpinnerCoverProps) {
  return (
    <div className={`${styles.root} ${styles[background]}`}>
      <DevSpinner position="static" size={48} />
      {label === undefined ? null : (
        <span className={styles.label}>{label}</span>
      )}
    </div>
  );
}
