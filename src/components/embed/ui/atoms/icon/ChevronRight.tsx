import * as React from "react";
import type { SVGProps } from "react";
const SvgChevronRight = ({
  width = 17,
  height = 16,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 17 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M6.5 12L10.5 8L6.5 4"
      stroke="currentColor"
      stroke-width="1.33333"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);
export default SvgChevronRight;
