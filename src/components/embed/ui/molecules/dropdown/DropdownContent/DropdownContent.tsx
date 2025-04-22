import React, { forwardRef } from "react";
import "./DropdownContent.css";

interface DropdownContentProps {
  children: React.ReactNode;
  open: boolean;
  top?: number;
}

const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(
  (props, ref) => {
    const { children, open, top } = props;
    return (
      <div
        className={`dropdown-content ${open ? "content-open" : null}`}
        style={{ top: top ? `${top}px` : "100%" }}
        ref={ref}
      >
        {children}
      </div>
    );
  }
);

export default DropdownContent;
