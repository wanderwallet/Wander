import styles from "./spinner.module.scss";

export interface DevSpinnerProps {
  position?: "absolute" | "static";
  size?: number;
}

export function DevSpinner({
  position = "absolute",
  size = 24
}: DevSpinnerProps) {
  return (
    <span
      className={`${styles.root} ${styles[position]}`}
      style={{ ["--size"]: `${size}px` } as any}
    >
      <span className={styles.icon}>💿</span>
    </span>
  );
}
