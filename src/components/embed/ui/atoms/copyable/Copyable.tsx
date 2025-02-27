import React from "react";
import styles from "./Copyable.module.css";
import type { CopyableBaseProps } from "./Copyable.types";
import { Loading } from "../loading";
import { Box, Text, CopyableIcon } from "..";

const Copyable = React.forwardRef<HTMLDivElement, CopyableBaseProps>(
  (
    {
      label,
      value,
      className,
      size,
      isFullWidth,
      isBlurry,
      isLoading,
      onClick,
      tooltipValue,
      ...props
    },
    ref
  ) => {
    const Component = "div";

    const handleChildren = () => {
      if (isLoading) {
        return <Loading />;
      }

      return (
        <Box alignment="left">
          <div className={styles["tooltip"]}>
            <Text variant="bodyMd">{label}</Text>
            <button className={styles["copyable__button"]} onClick={onClick}>
              {tooltipValue && (
                <span className={styles["tooltiptext"]}>{tooltipValue}</span>
              )}
              <Text
                className={styles["text__label"]}
                variant="bodyLg"
                style={{ color: "#191919" }}
              >
                {value}
              </Text>
              <CopyableIcon color="#757575" />
            </button>
          </div>
        </Box>
      );
    };

    return (
      <Component
        ref={ref}
        className={`
        ${styles["copyable"]}
        ${className}
        ${styles[`copyable__${size}`]}
        ${isBlurry ? styles["copyable__blurry"] : ""}
        ${styles["copyable__full__width"]}
      `}
        {...props}
      >
        {handleChildren()}
      </Component>
    );
  }
);

Copyable.displayName = "Copyable";

export { Copyable };
