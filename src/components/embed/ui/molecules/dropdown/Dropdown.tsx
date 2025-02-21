import React, { useState } from "react";
import styles from "./Dropdown.module.css";
import { DropdownBaseProps } from "./Dropdown.types";
import {
  ArrowDownIcon,
  ExpandItIcon,
  ProtocolLandIcon,
  Text
} from "../../atoms";

const Dropdown = React.forwardRef<HTMLDivElement, DropdownBaseProps>(
  ({ className, children, ...props }, ref) => {
    const Component = "button";

    const [showDropdown, setShowDropdown] = useState(false);

    return (
      <>
        <Component
          ref={ref}
          onClick={() => setShowDropdown(!showDropdown)}
          className={`
          ${styles["dropdown-button"]}
          ${className}`}
          {...props}
        >
          <ProtocolLandIcon />
          <Text variant="bodyMd" style={{ fontWeight: 600, color: "#121212" }}>
            Account 1
          </Text>
          <ArrowDownIcon className={styles["dropdown-icon"]} />
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
