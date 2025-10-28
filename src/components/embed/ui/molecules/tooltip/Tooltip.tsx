import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
  type ReactNode,
  type HTMLAttributes,
} from "react";
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
    const [tooltipState, setTooltipState] = useState({
      top: 0,
      left: 0,
      arrowOffset: {} as Record<string, string>,
    });
    const wrapperRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = useCallback(() => setIsVisible(true), []);
    const handleMouseLeave = useCallback(() => setIsVisible(false), []);

    useLayoutEffect(() => {
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

      // Store original position for arrow calculation
      const originalLeft = left;
      const originalTop = top;

      // Boundary detection - keep within viewport
      const padding = 8;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust horizontal position if overflowing
      if (left < padding) {
        left = padding;
      } else if (left + tooltipRect.width > viewportWidth - padding) {
        left = viewportWidth - tooltipRect.width - padding;
      }

      // Adjust vertical position if overflowing
      if (top < padding) {
        top = padding;
      } else if (top + tooltipRect.height > viewportHeight - padding) {
        top = viewportHeight - tooltipRect.height - padding;
      }

      // Calculate arrow offset to point at the wrapper element
      const newArrowOffset: Record<string, string> = {};

      if (position.startsWith("top") || position.startsWith("bottom")) {
        // For top/bottom positions, adjust horizontal arrow position
        if (left !== originalLeft) {
          const wrapperCenterX = wrapperRect.left + wrapperRect.width / 2;
          const arrowPositionFromLeft = wrapperCenterX - left;
          newArrowOffset["--arrow-left"] = `${arrowPositionFromLeft}px`;
          newArrowOffset["--arrow-transform"] = "translate(0, 0)";
        }
      } else if (position === "left" || position === "right") {
        // For left/right positions, adjust vertical arrow position
        if (top !== originalTop) {
          const wrapperCenterY = wrapperRect.top + wrapperRect.height / 2;
          const arrowPositionFromTop = wrapperCenterY - top;
          newArrowOffset["--arrow-top"] = `${arrowPositionFromTop}px`;
          newArrowOffset["--arrow-transform"] = "translate(0, 0)";
        }
      }

      setTooltipState({ top, left, arrowOffset: newArrowOffset });
    }, [isVisible, position]);

    const tooltipStyle = useMemo<React.CSSProperties>(() => {
      const style: React.CSSProperties = {
        top: `${tooltipState.top}px`,
        left: `${tooltipState.left}px`,
      };

      if (width !== undefined) {
        style.width = typeof width === "number" ? `${width}px` : width;
      }
      if (height !== undefined) {
        style.height = typeof height === "number" ? `${height}px` : height;
      }

      // Apply arrow offset as CSS custom properties
      Object.assign(style, tooltipState.arrowOffset);

      return style;
    }, [tooltipState, width, height]);

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
