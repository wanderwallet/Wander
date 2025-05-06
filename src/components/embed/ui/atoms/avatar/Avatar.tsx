import React, { forwardRef } from "react";
import clsx from "clsx";
import styles from "./Avatar.module.css";
import type { AvatarBaseProps } from "./Avatar.types";
import { Text } from "../text";
import { useTheme } from "../../../contexts/ThemeContext";

const Avatar = forwardRef<HTMLDivElement, AvatarBaseProps>(
  ({ children, className, backgroundColor, fontColor, isBlurry, size = "md", ...props }, ref) => {
    const { isDarkMode } = useTheme();

    const renderChildren = () => {
      if (typeof children === "string") {
        return (
          <Text
            variant="bodySm"
            style={{
              color: fontColor || (isDarkMode ? "var(--color-font-heading)" : "#FFF"),
            }}>
            {children.substring(0, 1).toUpperCase()}
          </Text>
        );
      }
      return children;
    };

    const avatarBg = backgroundColor || (isDarkMode ? "var(--color-card-background-default)" : undefined);

    return (
      <div
        className={clsx(
          styles.avatar,
          styles[`avatar__${size}`],
          isBlurry && styles.avatar__blurry,
          isDarkMode ? styles.avatar__dark : styles.avatar__light,
          className,
        )}
        style={{ backgroundColor: avatarBg }}
        ref={ref}
        {...props}>
        {renderChildren()}
      </div>
    );
  },
);

Avatar.displayName = "Avatar";

export { Avatar };
