import React, { forwardRef } from "react";
import styles from "./Avatar.module.css";
import type { AvatarBaseProps } from "./Avatar.types";
import { Text } from "../text";

const Avatar = forwardRef<HTMLDivElement, AvatarBaseProps>(
  ({ children, className, backgroundColor, fontColor, ...props }, ref) => {
    const Component = "div";

    const renderChildren = () => {
      if (typeof children === "string") {
        return (
          <Text variant="headingMd" style={{ color: fontColor }}>
            {children.substring(0, 1).toUpperCase()}
          </Text>
        );
      }

      return children;
    };

    return (
      <Component
        className={`
        ${styles["avatar"]}
        ${className}
      `}
        style={{ backgroundColor }}
        ref={ref}
        {...props}
      >
        {renderChildren()}
      </Component>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
