import type { SVGProps } from "react";

interface WarningIconProps extends SVGProps<SVGSVGElement> {
  color?: string;
  size?: number;
}

export const WarningIcon = ({ color, size = 23, ...props }: WarningIconProps) => {
  return (
    <svg width={size} height={size} viewBox="0 0 23 22" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M11.5 7V11M11.5 15H11.51M21.5 11C21.5 16.5228 17.0228 21 11.5 21C5.97715 21 1.5 16.5228 1.5 11C1.5 5.47715 5.97715 1 11.5 1C17.0228 1 21.5 5.47715 21.5 11Z"
        stroke={color || "#FF1A1A"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
