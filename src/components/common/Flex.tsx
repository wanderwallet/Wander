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
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  padding?: CSSProperties["padding"];
  cursor?: CSSProperties["cursor"];
  textAlign?: CSSProperties["textAlign"];
  background?: CSSProperties["background"];
  borderRadius?: CSSProperties["borderRadius"];
  overflow?: CSSProperties["overflow"];
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
  width,
  height,
  padding,
  cursor,
  textAlign,
  overflow,
  style,
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
        width,
        height,
        padding,
        cursor,
        textAlign,
        background,
        borderRadius,
        flexShrink,
        overflow,
        ...style,
      }}
      {...props}>
      {children}
    </div>
  );
};
