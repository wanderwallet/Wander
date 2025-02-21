import React, { useState } from "react";
import styles from "./Popover.module.css";
import { PopoverBaseProps } from "./Popover.types";
import { ExpandItIcon, ProtocolLandIcon, Row, Text } from "../../atoms";

const Popover = React.forwardRef<HTMLDivElement, PopoverBaseProps>(
  ({ id, icon, label, className, children, ...props }, ref) => {
    const Component = "div";

    const [showPopover, setShowPopover] = useState(false);

    return (
      <Component
        id={id}
        ref={ref}
        className={`
      ${styles["popover-button"]}
      ${showPopover ? styles["popover-button--expanded"] : ""}
      ${className}`}
        {...props}
      >
        {!showPopover ? (
          <>
            {icon}
            <Row alignment="center">
              <Text
                className={`${!icon ? styles["popover-button--no-icon"] : ""}`}
                variant="bodyMd"
                style={{
                  fontWeight: 600,
                  color: "#121212",
                  marginBottom: "0px"
                }}
              >
                {label}
              </Text>
            </Row>
            <button
              onClick={() => setShowPopover(!showPopover)}
              className={styles["popover-icon"]}
            >
              <ExpandItIcon />
            </button>
          </>
        ) : (
          React.Children.map(children, (child) =>
            React.isValidElement(child)
              ? React.cloneElement(child, { setShowPopover })
              : child
          )
        )}
      </Component>
    );
  }
);

Popover.displayName = "Popover";

export { Popover };
