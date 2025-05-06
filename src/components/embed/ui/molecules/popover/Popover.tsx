import React, { useState } from "react";
import styles from "./Popover.module.css";
import type { PopoverBaseProps } from "./Popover.types";
import { ExpandItIcon, ProtocolLandIcon, Row, Text } from "../../atoms";
import { useTheme } from "../../../contexts/ThemeContext";

const Popover = React.forwardRef<HTMLDivElement, PopoverBaseProps>(
  ({ id, icon, label, className, children, ...props }, ref) => {
    const Component = "div";
    const { isDarkMode } = useTheme();
    const [showPopover, setShowPopover] = useState(false);

    const textColor = isDarkMode ? "var(--color-font-heading)" : "#121212";
    const borderColor = isDarkMode ? "var(--color-border-popover)" : undefined;
    const backgroundColor = isDarkMode ? "var(--color-card-background-default)" : undefined;

    return (
      <Component
        id={id}
        ref={ref}
        className={`
          ${styles["popover-button"]}
          ${showPopover ? styles["popover-button--expanded"] : ""}
          ${className}
        `}
        style={{
          borderColor: borderColor,
          backgroundColor: backgroundColor,
        }}
        {...props}>
        {!showPopover ? (
          <>
            {icon}
            <Row alignment="center">
              <Text
                className={`${!icon ? styles["popover-button--no-icon"] : ""}`}
                variant="bodyMd"
                style={{
                  fontWeight: 600,
                  color: textColor,
                  marginBottom: "0px",
                }}>
                {label}
              </Text>
            </Row>
            <button onClick={() => setShowPopover(!showPopover)} className={styles["popover-icon"]}>
              <ExpandItIcon color={isDarkMode ? "var(--color-font-body)" : undefined} />
            </button>
          </>
        ) : (
          React.Children.map(children, (child) =>
            React.isValidElement(child) ? React.cloneElement(child, { setShowPopover }) : child,
          )
        )}
      </Component>
    );
  },
);

Popover.displayName = "Popover";

export { Popover };
