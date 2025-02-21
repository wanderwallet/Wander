import React from "react";
import styles from "./Loading.module.css";
import type { LoadingBaseProps } from "./Loading.types";

const Loading = React.forwardRef<HTMLDivElement, LoadingBaseProps>(
  ({ size = "medium", className, isAnchor, ...props }, ref) => {
    const Component = "div";

    return (
      <Component
        ref={ref}
        className={`
        ${styles["loading"]}
        ${styles[`.loading--${size}`]}
        ${isAnchor && styles["button__load__link"]}
        ${className}
      `}
        {...props}
      />
    );
  }
);

Loading.displayName = "Loading";

export { Loading };
