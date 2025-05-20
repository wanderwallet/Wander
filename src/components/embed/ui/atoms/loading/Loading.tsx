import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Loading.module.css";
import type { LoadingBaseProps } from "./Loading.types";

// TODO: Delete and use the one from "@arconnect/components" everywhere.
const Loading = forwardRef<HTMLDivElement, LoadingBaseProps>(({
  className,
  size = "md",
  color,
  ...props
}, ref) => {
  return (
    <div
      className={clsx(styles.loading, styles[`loading__${size}`], className)}
      style={{ borderTopColor: color }}
      ref={ref}
      {...props}
    />
  );
});

Loading.displayName = "Loading";

export { Loading };
