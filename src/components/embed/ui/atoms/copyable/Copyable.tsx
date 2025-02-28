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
          <Text variant="bodyMd">{label}</Text>
          <button className={styles["copyable__button"]} onClick={onClick}>
            <Text
              className={styles["text__label"]}
              variant="bodyLg"
              style={{ color: "#191919" }}
            >
              {value}
            </Text>
            <CopyableIcon color="#757575" />
          </button>
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
        ${isFullWidth ? styles["copyable__full__width"] : ""}
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
