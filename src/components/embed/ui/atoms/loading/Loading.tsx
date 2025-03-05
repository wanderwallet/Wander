import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Loading.module.css";
import type { LoadingBaseProps } from "./Loading.types";

const Loading = forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "md", color, className, ...props }, ref) => {
    return (
      <div
        className={clsx(styles.loading, styles[`loading__${size}`], className)}
        style={{ borderTopColor: color }}
        ref={ref}
        {...props}
      />
    );
  }
);

Loading.displayName = "Loading";

export { Loading };
