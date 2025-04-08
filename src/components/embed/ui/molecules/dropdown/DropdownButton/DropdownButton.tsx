import React, { forwardRef } from "react";

import { ArrowDownIcon, ArrowUpIcon } from "../../../atoms";
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
          onClick={(e) => {
            e.stopPropagation();
            toggle();
          }}
        >
          {open ? <ArrowUpIcon /> : <ArrowDownIcon />}
        </span>
      </div>
    );
  }
);

export default DropdownButton;
