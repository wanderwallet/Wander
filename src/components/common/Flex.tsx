import React from "react";
import type { CSSProperties } from "styled-components";

interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: CSSProperties["flexDirection"];
  align?: CSSProperties["alignItems"];
  justify?: CSSProperties["justifyContent"];
  wrap?: CSSProperties["flexWrap"];
  gap?: CSSProperties["gap"];
  flex?: CSSProperties["flex"];
  flexShrink?: CSSProperties["flexShrink"];
  minWidth?: CSSProperties["minWidth"];
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  padding?: CSSProperties["padding"];
  margin?: CSSProperties["margin"];
  cursor?: CSSProperties["cursor"];
  textAlign?: CSSProperties["textAlign"];
  background?: CSSProperties["background"];
  borderRadius?: CSSProperties["borderRadius"];
  overflow?: CSSProperties["overflow"];
  boxSizing?: CSSProperties["boxSizing"];
  maxWidth?: CSSProperties["maxWidth"];
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = "row",
  align = "stretch",
  justify = "flex-start",
  wrap = "nowrap",
  background,
  borderRadius,
  flexShrink,
  gap = 0,
  flex,
  minWidth,
  width,
  height,
  padding,
  margin,
  cursor,
  textAlign,
  overflow,
  style,
  boxSizing,
  maxWidth,
  ...props
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap,
        gap,
        flex,
        minWidth,
        width,
        height,
        padding,
        margin,
        cursor,
        textAlign,
        background,
        borderRadius,
        // Only apply flexShrink if flex shorthand is not set to avoid conflicts
        ...(flex === undefined && { flexShrink }),
        overflow,
        boxSizing,
        maxWidth,
        ...style,
      }}
      {...props}>
      {children}
    </div>
  );
};
