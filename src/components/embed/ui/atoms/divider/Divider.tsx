import React from "react";
import styles from "./Divider.module.css";
import type { DividerBaseProps } from "./Divider.types";
import { Text } from "..";
const Divider = React.forwardRef<HTMLDivElement, DividerBaseProps>(
  ({ text, textPosition = "center", className, ...props }, ref) => {
    const Component = "div";

    return (
      <Component
        ref={ref}
        className={`
        ${styles["divider"]}
        ${styles[`divider--text-${textPosition}`]}
        ${className}
      `}
        {...props}
      >
        {text && (
          <Text
            alignment={textPosition}
            className={styles["divider__text"]}
            variant={"bodyXs"}
          >
            {text}
          </Text>
        )}
      </Component>
    );
  }
);

Divider.displayName = "Divider";

export { Divider };
