import * as React from "react";
import type { SVGProps } from "react";
const SvgCheck = ({
  width = 18,
  height = 17,
  ...props
}: SVGProps<SVGSVGElement>) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 18 17"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
    color="currentColor"
  >
    <path
      d="M14.6666 4.25L6.87498 12.0417L3.33331 8.5"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);
export default SvgCheck;
