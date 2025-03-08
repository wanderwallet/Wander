import React, { type CSSProperties } from "react";

interface BoxProps {
  children?: React.ReactNode;
  padding?: string | number;
  margin?: string | number;
  width?: string | number;
  height?: string | number;
  backgroundColor?: string;
  borderRadius?: string | number;
  display?: CSSProperties["display"];
  flexDirection?: CSSProperties["flexDirection"];
  alignItems?: CSSProperties["alignItems"];
  justifyContent?: CSSProperties["justifyContent"];
  gap?: string | number;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

const Box: React.FC<BoxProps> = ({
  children,
  padding,
  margin,
  width,
  height,
  backgroundColor,
  borderRadius,
  display,
  flexDirection,
  alignItems,
  justifyContent,
  gap,
  onClick,
  style,
  className
}) => {
  const boxStyle: CSSProperties = {
    padding,
    margin,
    width,
    height,
    backgroundColor,
    borderRadius,
    display,
    flexDirection,
    alignItems,
    justifyContent,
    gap,
    ...style
  };

  return (
    <div className={className} style={boxStyle} onClick={onClick}>
      {children}
    </div>
  );
};

export default Box;
