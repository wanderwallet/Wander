import React, { forwardRef } from "react";
import styles from "./Box.module.css";
import type { BoxBaseProps } from "./Box.types";

const Box = forwardRef<HTMLDivElement, BoxBaseProps>(
  (
    {
      children,
      className,
      position = "relative",
      alignment = "center",
      hasBorder = false,
      isBlurry = false,
      isAutoWidth = false,
      ...props
    },
    ref
  ) => {
    const Component = "div";

    return (
      <Component
        className={`
        ${styles["box"]}
        ${hasBorder && styles["box__border"]}
        ${styles[`box__${alignment}`]}
        ${styles[`box__${position}`]}
        ${isBlurry && styles["box__blurry"]}
        ${isAutoWidth && styles["box__width-auto"]}
        ${className}
      `}
        ref={ref}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Box.displayName = "Box";

export { Box };
