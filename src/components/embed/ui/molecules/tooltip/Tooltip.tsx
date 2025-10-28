import React, { useState, useCallback, useMemo, useRef, useEffect, type ReactNode, type HTMLAttributes } from "react";
import styles from "./Tooltip.module.css";

export type TooltipPosition = "top" | "topStart" | "topEnd" | "bottom" | "bottomStart" | "bottomEnd" | "left" | "right";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  children: ReactNode;
  content: ReactNode;
  position?: TooltipPosition;
  width?: string | number;
  height?: string | number;
}

const GAP = 12;

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ children, content, position = "top", className, style, width, height, ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = useCallback(() => setIsVisible(true), []);
    const handleMouseLeave = useCallback(() => setIsVisible(false), []);

    useEffect(() => {
      if (!isVisible || !wrapperRef.current || !tooltipRef.current) return;

      const wrapperRect = wrapperRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = 0;
      let left = 0;

      const centerX = wrapperRect.left + wrapperRect.width / 2 - tooltipRect.width / 2;
      const centerY = wrapperRect.top + wrapperRect.height / 2 - tooltipRect.height / 2;

      switch (position) {
        case "top":
          top = wrapperRect.top - tooltipRect.height - GAP;
          left = centerX;
          break;
        case "topStart":
          top = wrapperRect.top - tooltipRect.height - GAP;
          left = wrapperRect.left;
          break;
        case "topEnd":
          top = wrapperRect.top - tooltipRect.height - GAP;
          left = wrapperRect.right - tooltipRect.width;
          break;
        case "bottom":
          top = wrapperRect.bottom + GAP;
          left = centerX;
          break;
        case "bottomStart":
          top = wrapperRect.bottom + GAP;
          left = wrapperRect.left;
          break;
        case "bottomEnd":
          top = wrapperRect.bottom + GAP;
          left = wrapperRect.right - tooltipRect.width;
          break;
        case "left":
          top = centerY;
          left = wrapperRect.left - tooltipRect.width - GAP;
          break;
        case "right":
          top = centerY;
          left = wrapperRect.right + GAP;
          break;
      }

      setCoords({ top, left });
    }, [isVisible, position]);

    const tooltipStyle = useMemo<React.CSSProperties>(
      () => ({
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        ...(width !== undefined && {
          width: typeof width === "number" ? `${width}px` : width,
        }),
        ...(height !== undefined && {
          height: typeof height === "number" ? `${height}px` : height,
        }),
      }),
      [coords.top, coords.left, width, height],
    );

    return (
      <div
        ref={wrapperRef}
        className={`${styles["tooltip-wrapper"]} ${className || ""}`}
        style={style}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}>
        {children}
        {isVisible && content && (
          <div
            ref={tooltipRef}
            className={`${styles["tooltip"]} ${styles[`tooltip--${position}`]}`}
            style={tooltipStyle}>
            {content}
          </div>
        )}
      </div>
    );
  },
);

Tooltip.displayName = "Tooltip";

export { Tooltip };
