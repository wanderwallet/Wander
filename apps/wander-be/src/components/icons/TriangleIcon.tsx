import React from "react";

interface TriangleIconProps {
  width?: number;
  height?: number;
  color: string;
  negative?: boolean;
}

const TriangleIcon: React.FC<TriangleIconProps> = ({ width = 10, height = 7, color, negative = false }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 10 7"
      fill="none"
      style={{ transform: `rotate(${negative ? "180deg" : "0deg"})` }}>
      <path d="M4.74999 0.5L9.08012 6.5H0.419861L4.74999 0.5Z" fill={color || "#000000"} />
    </svg>
  );
};

export default TriangleIcon;
