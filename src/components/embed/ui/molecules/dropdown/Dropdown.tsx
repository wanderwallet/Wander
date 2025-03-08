import React, { useState } from "react";
import styles from "./Dropdown.module.css";
import type { DropdownBaseProps } from "./Dropdown.types";
import {
  ArrowDownIcon,
  ExpandItIcon,
  ProtocolLandIcon,
  Text
} from "../../atoms";
import { useTheme } from "../../../contexts/ThemeContext";

const Dropdown = React.forwardRef<HTMLDivElement, DropdownBaseProps>(
  ({ className, children, ...props }, ref) => {
    const Component = "button";
    const { isDarkMode } = useTheme();
    const [showDropdown, setShowDropdown] = useState(false);

    const textColor = isDarkMode ? "var(--color-font-heading)" : "#121212";
    const borderColor = isDarkMode ? "var(--color-border-popover)" : undefined;
    const backgroundColor = isDarkMode
      ? "var(--color-card-background-default)"
      : undefined;
    const iconColor = isDarkMode ? "var(--color-font-body)" : undefined;

    return (
      <>
        <Component
          ref={ref}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`${styles["dropdown-button"]} ${className}`}
          style={{
            borderColor: borderColor,
            backgroundColor: backgroundColor
          }}
          {...props}
        >
          <ProtocolLandIcon color={iconColor} />
          <Text variant="bodyMd" style={{ fontWeight: 600, color: textColor }}>
            Account 1
          </Text>
          <ArrowDownIcon
            className={styles["dropdown-icon"]}
            color={iconColor}
          />
        </Component>
        {showDropdown && (
          <div id="dropdown-content" className={styles["dropdown"]}>
            {children}
          </div>
        )}
      </>
    );
  }
);

Dropdown.displayName = "Dropdown";

export { Dropdown };
