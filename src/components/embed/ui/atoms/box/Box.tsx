import React, { forwardRef } from "react";
import clsx from "clsx";
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
      style,
      onClick,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        className={clsx(
          styles.box,
          styles[`box__${position}`],
          styles[`box__${alignment}`],
          hasBorder && styles.box__border,
          isBlurry && styles.box__blurry,
          isAutoWidth && styles.box__width_auto,
          className,
        )}
        style={style}
        ref={ref}
        onClick={onClick}
        {...props}>
        {children}
      </div>
    );
  },
);

Box.displayName = "Box";

export { Box };
