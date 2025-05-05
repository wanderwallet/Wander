import React, { forwardRef } from "react";

import { ArrowDownIcon } from "../../../atoms";
import "./DropdownButton.css";

interface DropdownButtonProps {
  children: React.ReactNode;
  toggle: () => void;
  open: boolean;
}

const DropdownButton = forwardRef<HTMLDivElement, DropdownButtonProps>(
  (props, ref) => {
    const { children, toggle, open } = props;

    return (
      <div
        onClick={toggle}
        className={`dropdown-btn ${open ? "button-open" : null}`}
        ref={ref}
      >
        {children}
        <span
          className="toggle-icon"
          style={{ color: "var(--color-font-body)" }}
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          <ArrowDownIcon
            style={{
              transition: "transform linear 150ms",
              transform: open ? "rotate(-180deg)" : "rotate(0)"
            }}
          />
        </span>
      </div>
    );
  }
);

export default DropdownButton;
